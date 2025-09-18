import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ThreadsService } from '../threads/threads.service';
import { OpenAiService, ChatMessage } from '../openai/openai.service';
import { MessageSender } from '../common/enums';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly threadsService: ThreadsService,
    private readonly openAiService: OpenAiService,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    userId?: string,
  ): Promise<Message> {
    // Validate thread exists and user has access
    if (userId) {
      await this.threadsService.findOneByUser(
        createMessageDto.threadId,
        userId,
      );
    } else {
      await this.threadsService.findOne(createMessageDto.threadId);
    }

    const message = this.messageRepository.create(createMessageDto);
    return this.messageRepository.save(message);
  }

  async createByUser(
    createMessageDto: CreateMessageDto,
    userId: string,
  ): Promise<Message> {
    // Validate thread exists and user has access
    await this.threadsService.findOneByUser(createMessageDto.threadId, userId);
    const message = this.messageRepository.create(createMessageDto);
    return this.messageRepository.save(message);
  }

  async findByThread(threadId: string, userId?: string): Promise<Message[]> {
    // Validate thread exists and user has access
    if (userId) {
      await this.threadsService.findOneByUser(threadId, userId);
    } else {
      await this.threadsService.findOne(threadId);
    }

    return this.messageRepository.find({
      where: { threadId },
      order: { createdAt: 'ASC' },
    });
  }

  async findByThreadForUser(
    threadId: string,
    userId: string,
  ): Promise<Message[]> {
    // Validate thread exists and user has access
    await this.threadsService.findOneByUser(threadId, userId);

    return this.messageRepository.find({
      where: { threadId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(
    sendMessageDto: SendMessageDto,
    userId?: string,
  ): Promise<{
    userMessage: Message;
    assistantMessage: Message;
  }> {
    const { threadId, content } = sendMessageDto;

    // Get thread with assistant info and validate user access
    const thread = userId
      ? await this.threadsService.findOneByUser(threadId, userId)
      : await this.threadsService.findOne(threadId);

    // Save user message
    const userMessage = await this.create({
      threadId,
      sender: MessageSender.USER,
      content,
    });

    // Get conversation history
    const messages = await this.findByThread(threadId, userId);

    // Prepare OpenAI messages
    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: thread.assistant.systemPrompt,
      },
    ];

    // Add conversation history (excluding the just-added user message to avoid duplication)
    messages
      .filter((msg) => msg.id !== userMessage.id)
      .forEach((msg) => {
        chatMessages.push({
          role: msg.sender === MessageSender.USER ? 'user' : 'assistant',
          content: msg.content,
        });
      });

    // Add the current user message
    chatMessages.push({
      role: 'user',
      content,
    });

    // Generate AI response
    const aiResponse =
      await this.openAiService.generateChatCompletion(chatMessages);

    // Save assistant message
    const assistantMessage = await this.create({
      threadId,
      sender: MessageSender.ASSISTANT,
      content: aiResponse,
    });

    // Update thread summary if conversation is getting long
    const totalMessages = await this.messageRepository.count({
      where: { threadId },
    });
    if (totalMessages >= 10 && totalMessages % 5 === 0) {
      await this.updateThreadSummary(threadId);
    }

    return {
      userMessage,
      assistantMessage,
    };
  }

  async sendMessageByUser(
    sendMessageDto: SendMessageDto,
    userId: string,
  ): Promise<{
    userMessage: Message;
    assistantMessage: Message;
  }> {
    const { threadId, content } = sendMessageDto;

    // Get thread with assistant info and validate user access
    const thread = await this.threadsService.findOneByUser(threadId, userId);

    // Save user message
    const userMessage = await this.createByUser(
      {
        threadId,
        sender: MessageSender.USER,
        content,
      },
      userId,
    );

    // Get conversation history
    const messages = await this.findByThreadForUser(threadId, userId);

    // Prepare OpenAI messages
    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: thread.assistant.systemPrompt,
      },
    ];

    // Add conversation history (excluding the just-added user message to avoid duplication)
    messages
      .filter((msg) => msg.id !== userMessage.id)
      .forEach((msg) => {
        chatMessages.push({
          role: msg.sender === MessageSender.USER ? 'user' : 'assistant',
          content: msg.content,
        });
      });

    // Add the current user message
    chatMessages.push({
      role: 'user',
      content,
    });

    // Generate AI response
    const aiResponse =
      await this.openAiService.generateChatCompletion(chatMessages);

    // Save assistant message
    const assistantMessage = await this.createByUser(
      {
        threadId,
        sender: MessageSender.ASSISTANT,
        content: aiResponse,
      },
      userId,
    );

    // Update thread summary if conversation is getting long
    const totalMessages = await this.messageRepository.count({
      where: { threadId },
    });
    if (totalMessages >= 10 && totalMessages % 5 === 0) {
      await this.updateThreadSummary(threadId);
    }

    return {
      userMessage,
      assistantMessage,
    };
  }

  private async updateThreadSummary(threadId: string): Promise<void> {
    try {
      const messages = await this.findByThread(threadId);
      const messageContents = messages.map(
        (msg) => `${msg.sender}: ${msg.content}`,
      );

      const summary = await this.openAiService.generateSummary(messageContents);
      await this.threadsService.updateSummary(threadId, summary);
    } catch (error) {
      // Log error but don't fail the main operation
      this.logger.error('Failed to update thread summary', error as Error);
    }
  }

  async findOne(id: string, userId?: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['thread'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Check if user has access to the thread containing this message
    if (userId && message.thread.userId !== userId) {
      throw new ForbiddenException(
        'You can only access messages from your own threads',
      );
    }

    return message;
  }

  async findOneByUser(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['thread'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Check if user has access to the thread containing this message
    if (message.thread.userId !== userId) {
      throw new ForbiddenException(
        'You can only access messages from your own threads',
      );
    }

    return message;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const message = await this.findOne(id, userId);
    await this.messageRepository.remove(message);
  }

  async removeByUser(id: string, userId: string): Promise<void> {
    const message = await this.findOneByUser(id, userId);
    await this.messageRepository.remove(message);
  }
}
