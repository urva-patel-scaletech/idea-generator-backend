import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Assistant } from '../entities/assistant.entity';
import { Thread } from '../entities/thread.entity';
import { User } from '../entities/user.entity';
import { Message } from '../entities/message.entity';
import { MessageSender } from '../common/enums';
import { GeminiService } from '../gemini/gemini.service';
import {
  GenerateDto,
  RefineDto,
  SaveIdeaDto,
  ShareIdeaDto,
  ChatWithAiDto,
} from './dto/generate.dto';

@Injectable()
export class GenerateService {
  constructor(
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
    @InjectRepository(Thread)
    private threadRepository: Repository<Thread>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private geminiService: GeminiService,
  ) {}

  async generateContent(userId: string, generateDto: GenerateDto) {
    // Find assistant by ID or appType
    const assistant = await this.findAssistant(generateDto.appId);

    if (!assistant) {
      throw new NotFoundException(
        `No assistant found for: ${generateDto.appId}`,
      );
    }

    // Auto-resolve parameters from assistant settings and user context
    const resolvedParams = await this.resolveGenerationParams(
      assistant,
      generateDto.message,
      generateDto.overrides,
      userId,
    );

    // Generate content using Gemini
    const rawGeneratedContent = await this.geminiService.generateByAppType(
      assistant.appType,
      generateDto.message,
      assistant.promptConfig,
      assistant.outputFormat,
      assistant.appSettings,
      resolvedParams,
    );

    // Assign unique IDs to each card
    const generatedContent = this.assignCardIds(rawGeneratedContent);

    // Create thread to store the generated content
    const thread = this.threadRepository.create({
      userId,
      assistantId: assistant.id,
      title: this.generateTitle(generateDto.message, assistant.appType),
      metadata: {
        appType: assistant.appType,
        userInput: generateDto.message,
        resolvedParams,
        generatedContent,
        refinementHistory: [],
        userActions: {
          saved: [],
          shared: [],
          refined: [],
        },
        createdAt: new Date(),
      },
    });
    console.log('thread', thread.metadata.generatedContent);
    const savedThread = await this.threadRepository.save(thread);

    return {
      threadId: savedThread.id,
      appType: assistant.appType,
      results: Array.isArray(generatedContent)
        ? generatedContent
        : [generatedContent],
      refinementOptions: assistant.appSettings?.refinementOptions || [],
    };
  }

  async refineContent(userId: string, threadId: string, refineDto: RefineDto) {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId, userId },
      relations: ['assistant'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const originalContent = thread.metadata?.generatedContent;
    if (!originalContent) {
      throw new BadRequestException('No content to refine');
    }

    // Find the specific card to refine by ID
    const contentToRefine = this.findCardById(
      originalContent,
      refineDto.cardId,
    );
    if (!contentToRefine) {
      throw new NotFoundException(`Card with ID ${refineDto.cardId} not found`);
    }

    const refinedContent = await this.geminiService.refineContent(
      contentToRefine,
      refineDto.aspect,
      thread.assistant.promptConfig,
      refineDto.options,
    );

    // Update thread metadata with refinement
    const updatedMetadata = {
      ...thread.metadata,
      refinementHistory: [
        ...(thread.metadata?.refinementHistory || []),
        {
          cardId: refineDto.cardId,
          aspect: refineDto.aspect,
          refinedContent,
          timestamp: new Date(),
        },
      ],
    };

    await this.threadRepository.update(threadId, { metadata: updatedMetadata });

    return {
      threadId,
      aspect: refineDto.aspect,
      refinedContent,
      originalContent: contentToRefine,
    };
  }

  async saveIdea(userId: string, threadId: string, saveDto: SaveIdeaDto) {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId, userId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const generatedContent = thread.metadata?.generatedContent;
    if (!generatedContent) {
      throw new BadRequestException('No content to save');
    }

    // Find the specific idea to save
    const ideaToSave = Array.isArray(generatedContent)
      ? generatedContent.find(
          (item, index) => index.toString() === saveDto.ideaId,
        )
      : generatedContent;

    if (!ideaToSave) {
      throw new NotFoundException('Idea not found');
    }

    // Update thread metadata with saved idea
    const updatedMetadata = {
      ...thread.metadata,
      userActions: {
        ...thread.metadata?.userActions,
        saved: [
          ...(thread.metadata?.userActions?.saved || []),
          {
            ideaId: saveDto.ideaId,
            customTitle: saveDto.customTitle,
            savedAt: new Date(),
            content: ideaToSave,
          },
        ],
      },
    };

    await this.threadRepository.update(threadId, { metadata: updatedMetadata });

    return {
      message: 'Idea saved successfully',
      savedIdea: {
        id: saveDto.ideaId,
        title: saveDto.customTitle || ideaToSave.title,
        content: ideaToSave,
      },
    };
  }

  async shareIdea(userId: string, threadId: string, shareDto: ShareIdeaDto) {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId, userId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const generatedContent = thread.metadata?.generatedContent;
    if (!generatedContent) {
      throw new BadRequestException('No content to share');
    }

    // Find the specific idea to share
    const ideaToShare = Array.isArray(generatedContent)
      ? generatedContent.find(
          (item, index) => index.toString() === shareDto.ideaId,
        )
      : generatedContent;

    if (!ideaToShare) {
      throw new NotFoundException('Idea not found');
    }

    // Generate share link (simplified for now)
    const shareId = `${threadId}-${shareDto.ideaId}-${Date.now()}`;
    const shareLink = `/shared/${shareId}`;

    // Update thread metadata with shared idea
    const updatedMetadata = {
      ...thread.metadata,
      userActions: {
        ...thread.metadata?.userActions,
        shared: [
          ...(thread.metadata?.userActions?.shared || []),
          {
            ideaId: shareDto.ideaId,
            shareId,
            shareLink,
            sharedAt: new Date(),
            settings: shareDto.shareSettings,
            content: ideaToShare,
          },
        ],
      },
    };

    await this.threadRepository.update(threadId, { metadata: updatedMetadata });

    return {
      message: 'Idea shared successfully',
      shareLink,
      shareId,
      sharedIdea: ideaToShare,
    };
  }

  async getThread(userId: string, threadId: string) {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId, userId },
      relations: ['assistant'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return {
      id: thread.id,
      title: thread.title,
      appType: thread.assistant.appType,
      metadata: thread.metadata,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }

  async getTrendingIdeas(appType?: string) {
    console.log(appType);
    // Simple trending algorithm based on recent activity
    const queryBuilder = this.threadRepository
      .createQueryBuilder('thread')
      .leftJoinAndSelect('thread.assistant', 'assistant')
      .where('thread.metadata IS NOT NULL');

    if (appType) {
      queryBuilder.andWhere("thread.metadata->>'appType' = :appType", {
        appType,
      });
    }

    const threads = await queryBuilder
      .orderBy('thread.updatedAt', 'DESC')
      .limit(10)
      .getMany();

    return threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      appType: thread.assistant.appType,
      generatedContent: thread.metadata?.generatedContent,
      userActions: thread.metadata?.userActions,
      score: this.calculateTrendingScore(thread.metadata),
      updatedAt: thread.updatedAt,
    }));
  }

  /**
   * Find assistant by ID (UUID) or appType (string)
   */
  private async findAssistant(appId: string): Promise<Assistant | null> {
    return await this.assistantRepository.findOne({
      where: { id: appId, isActive: true },
    });
  }

  /**
   * Auto-resolve generation parameters from assistant settings, user context, and overrides
   */
  private async resolveGenerationParams(
    assistant: Assistant,
    userMessage: string,
    overrides?: any,
    userId?: string,
  ): Promise<any> {
    console.log('Assistant:', assistant);
    console.log('User Message:', userMessage);
    console.log('Overrides:', overrides);
    console.log('User ID:', userId);
    // Start with default settings from assistant
    const defaultParams = {
      count: assistant.appSettings?.defaultCount || 6,
      industry: assistant.appSettings?.defaultIndustry || 'general',
      complexity: assistant.appSettings?.defaultComplexity || 'simple',
      format: assistant.appSettings?.defaultFormat || 'cards',
      ...assistant.appSettings?.defaultOptions,
    };

    // Try to infer parameters from user message using assistant's inference prompt
    const inferredParams = await this.inferParamsFromMessage(
      userMessage,
      assistant,
    );

    // Get user context (could include past preferences, industry, etc.)
    const userContext = await this.getUserContext(userId);

    // Merge in order of priority: defaults < user context < inferred < overrides
    const resolvedParams = {
      ...defaultParams,
      ...userContext,
      ...inferredParams,
      ...overrides,
    };

    console.log('=== PARAMETER RESOLUTION DEBUG ===');
    console.log('Default Params:', defaultParams);
    console.log('User Context:', userContext);
    console.log('Inferred Params:', inferredParams);
    console.log('Overrides:', overrides);
    console.log('Final Resolved Params:', resolvedParams);
    console.log('=== END DEBUG ===');

    return resolvedParams;
  }

  /**
   * AI-powered parameter inference from user message using database prompt
   */
  private async inferParamsFromMessage(
    message: string,
    assistant?: any,
  ): Promise<any> {
    return await this.geminiService.extractParameters(message, assistant);
  }

  /**
   * Fallback basic parameter inference
   */
  private basicParameterInference(message: string): any {
    const lowerMessage = message.toLowerCase();
    const params: any = {};

    // Basic industry detection
    const industries = {
      tech: ['tech', 'software', 'app', 'digital', 'ai', 'startup'],
      food: ['food', 'restaurant', 'cooking', 'recipe', 'kitchen'],
      health: ['health', 'fitness', 'medical', 'wellness', 'doctor'],
      education: ['education', 'learning', 'school', 'course', 'training'],
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        params.industry = industry;
        break;
      }
    }

    return params;
  }

  /**
   * Get user context for parameter resolution
   */
  private getUserContext(userId?: string): any {
    if (!userId) return {};

    // In a real app, you might fetch user preferences, past interactions, etc.
    // For now, return empty object
    return {};
  }

  private generateTitle(input: string, appType: string): string {
    const maxLength = 100;
    let title = '';

    switch (appType) {
      case 'idea-generator':
        title = `Ideas for ${input}`;
        break;
      case 'blog-writer':
        title = `Blog about ${input}`;
        break;
      default:
        title = `Generated content for ${input}`;
    }

    return title.length > maxLength
      ? title.substring(0, maxLength) + '...'
      : title;
  }

  private calculateTrendingScore(metadata: any): number {
    if (!metadata) return 0;

    const savedCount = metadata.userActions?.saved?.length || 0;
    const sharedCount = metadata.userActions?.shared?.length || 0;
    const refinedCount = metadata.refinementHistory?.length || 0;

    // Simple scoring algorithm
    return savedCount * 3 + sharedCount * 5 + refinedCount * 2;
  }

  /**
   * Generate a random score between 7.0 and 9.5 for cards that don't have scores
   */
  private generateRandomScore(): number {
    return Math.round((Math.random() * 2.5 + 7.0) * 10) / 10;
  }

  /**
   * Assign unique IDs to each card in the generated content
   */
  private assignCardIds(content: any): any {
    console.log('Processing content type:', typeof content);
    console.log('Raw content:', content);
    // If content is a string (JSON), try to parse it first
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        console.log('Parsed JSON content:', parsed);
        return this.assignCardIds(parsed);
      } catch (error) {
        console.error('Failed to parse JSON content:', error);
        // If parsing fails, wrap the string content in an object with ID and score
        return {
          id: uuidv4(),
          content: content,
          score: this.generateRandomScore(),
        };
      }
    }

    if (Array.isArray(content)) {
      return content.map((card) => ({
        ...card,
        id: uuidv4(),
        score: card.score || this.generateRandomScore(),
      }));
    } else if (content && typeof content === 'object') {
      return {
        ...content,
        id: uuidv4(),
        score: content.score || this.generateRandomScore(),
      };
    }
    return content;
  }

  async chatWithAi(userId: string, threadId: string, chatDto: ChatWithAiDto) {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId, userId },
      relations: ['assistant'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const originalContent = thread.metadata?.generatedContent;
    if (!originalContent) {
      throw new BadRequestException('No content found in thread');
    }

    const cardToChat = this.findCardById(originalContent, chatDto.cardId);
    if (!cardToChat) {
      throw new NotFoundException(`Card with ID ${chatDto.cardId} not found`);
    }

    // Get existing messages from database for context (filtered by cardId)
    const existingMessages = await this.messageRepository.find({
      where: { threadId, cardId: chatDto.cardId },
      order: { createdAt: 'ASC' },
    });

    // Build card context
    const cardContext = this.buildCardContext(cardToChat, thread.metadata);

    // Convert existing messages to chat history format
    const chatHistory = existingMessages.map((msg) => ({
      role:
        msg.sender === MessageSender.USER
          ? ('user' as const)
          : ('assistant' as const),
      content: msg.content,
    }));

    // Generate AI response with card context and chat history
    const aiResponse = await this.geminiService.chatWithCardContext(
      cardContext,
      chatDto.message,
      chatHistory,
    );

    // Save user message to database
    const userMessage = await this.messageRepository.save({
      threadId,
      cardId: chatDto.cardId,
      sender: MessageSender.USER,
      content: chatDto.message,
    });

    // Save AI response to database
    const assistantMessage = await this.messageRepository.save({
      threadId,
      cardId: chatDto.cardId,
      sender: MessageSender.ASSISTANT,
      content: aiResponse,
    });

    return {
      threadId,
      cardId: chatDto.cardId,
      userMessage: userMessage.content,
      aiResponse: assistantMessage.content,
      timestamp: assistantMessage.createdAt,
    };
  }
  private buildCardContext(card: any, threadMetadata: any): string {
    let context = `Card Details:\n`;
    context += `Title: ${card.title || 'Untitled'}\n`;
    context += `Description: ${card.description || card.content || 'No description'}\n`;
    context += `Score: ${card.score || 'Not scored'}\n`;

    // Add refinement history for this card
    const refinements = threadMetadata?.refinementHistory?.filter(
      (r: any) => r.cardId === card.id,
    );
    if (refinements && refinements.length > 0) {
      context += `\nRefinement History:\n`;
      refinements.forEach((refinement: any, index: number) => {
        context += `${index + 1}. ${refinement.aspect}: ${
          refinement.refinedContent?.content || 'No content'
        }\n`;
      });
    }

    // Add user actions for this card
    const userActions = threadMetadata?.userActions;
    if (userActions) {
      const savedActions = userActions.saved?.filter(
        (s: any) => s.ideaId === card.id,
      );
      const sharedActions = userActions.shared?.filter(
        (s: any) => s.ideaId === card.id,
      );

      if (savedActions?.length > 0) {
        context += `\nUser has saved this idea ${savedActions.length} time(s).\n`;
      }
      if (sharedActions?.length > 0) {
        context += `\nUser has shared this idea ${sharedActions.length} time(s).\n`;
      }
    }

    return context;
  }

  async getChatHistoryByCard(userId: string, threadId: string, cardId: string) {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId, userId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const messages = await this.messageRepository.find({
      where: { threadId, cardId },
      order: { createdAt: 'ASC' },
    });

    return messages.map((msg) => ({
      sender: msg.sender,
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  }

  /**
   * Find a specific card by its ID from the generated content
   */
  private findCardById(content: any, cardId: string): any {
    if (Array.isArray(content)) {
      return content.find((card) => card.id === cardId);
    } else if (
      content &&
      typeof content === 'object' &&
      content.id === cardId
    ) {
      return content;
    }
    return null;
  }
}
