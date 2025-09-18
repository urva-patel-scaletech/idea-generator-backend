import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GeminiService } from '../gemini/gemini.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    if (!apiKey) {
      this.logger.warn(
        'OpenAI API key not found. Chat functionality will be disabled.',
      );
      return;
    }

    this.openai = new OpenAI({
      apiKey,
    });
    this.logger.log(`Initialized OpenAI service with model: ${this.model}`);
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    model?: string,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error(
        'OpenAI service not initialized. Please check your API key.',
      );
    }

    // Use configured model or fallback to default
    const modelToUse = model || this.model;

    try {
      const completion = await this.openai.chat.completions.create({
        model: modelToUse,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      this.logger.log(`OpenAI chat completion successful with ${modelToUse}`);
      return response.trim();
    } catch (error) {
      this.logger.error(`Error with ${modelToUse}:`, error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateSummary(messages: string[]): Promise<string> {
    if (!this.openai) {
      throw new Error(
        'OpenAI service not initialized. Please check your API key.',
      );
    }

    const conversationText = messages.join('\n\n');
    const prompt = `You are a helpful assistant that creates concise summaries of conversations. Summarize the key points and outcomes in 2-3 sentences.

Please summarize this conversation:

${conversationText}`;

    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that creates concise summaries of conversations.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.generateChatCompletion(chatMessages);
  }

  async generateByAppType(
    appType: string,
    userInput: string,
    promptConfig: any,
    outputFormat: any,
    appSettings: any,
    options: any = {},
  ): Promise<any> {
    if (!this.openai) {
      throw new Error(
        'OpenAI service not initialized. Please check your API key.',
      );
    }

    try {
      const prompt = this.buildPromptFromConfig(
        promptConfig,
        userInput,
        appSettings,
        options,
      );

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: prompt.systemPrompt,
        },
        {
          role: 'user',
          content: prompt.userPrompt,
        },
      ];

      const response = await this.generateChatCompletion(messages);
      return this.parseStructuredResponse(response, outputFormat);
    } catch (error) {
      this.logger.error('Error generating app-specific content:', error);
      throw new Error('Failed to generate content');
    }
  }

  private buildPromptFromConfig(
    promptConfig: any,
    userInput: string,
    appSettings: any,
    options: any,
  ): { systemPrompt: string; userPrompt: string } {
    if (!promptConfig?.systemTemplate || !promptConfig?.userTemplate) {
      throw new Error(
        'Missing required prompt templates in database configuration',
      );
    }

    const count = options.count || appSettings?.defaultCount || 5;
    const industry = options.industry || 'general';

    // Add business boundary enforcement to system prompt
    const businessBoundary = `\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related responses\n- If asked about non-business topics (personal advice, entertainment, general knowledge, etc.), politely redirect to business context\n- Example: "I focus on business solutions. Let me help you with business-related aspects of your question instead."\n- Stay within: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n`;

    // Replace all template variables in system prompt
    let systemPrompt: string = promptConfig.systemTemplate as string;
    systemPrompt = systemPrompt.replace(/{{count}}/g, String(count));
    systemPrompt = systemPrompt.replace(/{{industry}}/g, String(industry));
    systemPrompt += businessBoundary;

    // Replace additional variables if they exist
    Object.keys(options || {}).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      systemPrompt = systemPrompt.replace(regex, String(options[key] || ''));
    });

    // Replace all template variables in user prompt
    let userPrompt: string = promptConfig.userTemplate as string;
    userPrompt = userPrompt.replace(/{{input}}/g, userInput);
    userPrompt = userPrompt.replace(/{{count}}/g, String(count));
    userPrompt = userPrompt.replace(/{{industry}}/g, String(industry));

    // Replace additional variables if they exist
    Object.keys(options || {}).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      userPrompt = userPrompt.replace(regex, String(options[key] || ''));
    });

    return { systemPrompt, userPrompt };
  }

  private parseStructuredResponse(response: string, outputFormat: any): any {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();

      // Handle ```json code blocks
      const jsonMatch = cleanedResponse.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/,
      );
      if (jsonMatch) {
        cleanedResponse = jsonMatch[1].trim();
      }

      // Remove any leading/trailing backticks or quotes
      cleanedResponse = cleanedResponse.replace(/^[`"']+|[`"']+$/g, '');

      // Extract JSON from mixed content if present
      const jsonArrayMatch = cleanedResponse.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonArrayMatch) {
        cleanedResponse = jsonArrayMatch[0];
      }

      try {
        const parsed = JSON.parse(cleanedResponse.trim());

        // If it's an array, return it directly
        if (Array.isArray(parsed)) {
          return parsed;
        }

        // If it's an object, return it directly
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }

        return parsed;
      } catch (parseError) {
        this.logger.error('JSON parsing failed:', parseError);
        this.logger.error('Raw response:', response);
        this.logger.error('Cleaned response:', cleanedResponse);
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      this.logger.error('Failed to parse JSON response:', error);
      this.logger.error('Raw response:', response);

      // If not JSON, return as structured object based on format
      if (outputFormat?.type === 'array') {
        return [{ content: response, score: 7.5 }];
      }
      return { content: response };
    }
  }

  async refineContent(
    originalContent: any,
    refinementAspect: string,
    promptConfig: any,
    options: any = {},
  ): Promise<any> {
    if (!this.openai) {
      throw new Error(
        'OpenAI service not initialized. Please check your API key.',
      );
    }

    try {
      const refinementPrompt = this.buildRefinementPrompt(
        originalContent,
        refinementAspect,
        promptConfig,
        options,
      );

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: refinementPrompt.systemPrompt,
        },
        {
          role: 'user',
          content: refinementPrompt.userPrompt,
        },
      ];

      const response = await this.generateChatCompletion(messages);

      // For refinement responses, return the raw structured text instead of trying to parse as JSON
      // since our refinement templates produce markdown-formatted structured text, not JSON
      return {
        content: response,
        type: 'structured_text',
        aspect: refinementAspect,
      };
    } catch (error) {
      this.logger.error('Error refining content:', error);
      throw new Error('Failed to refine content');
    }
  }

  async chatWithCardContext(
    cardContext: string,
    userMessage: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error(
        'OpenAI service not initialized. Please check your API key.',
      );
    }

    try {
      const systemPrompt = `You are a concise, helpful business advisor.

Context about the specific idea:
${cardContext}

🚨 BUSINESS FOCUS BOUNDARY:
- ONLY provide business, entrepreneurship, startup, or commercial-related responses
- If asked about non-business topics (personal advice, entertainment, general knowledge, etc.), politely redirect to business context
- Example: "I focus on business solutions. Let me help you with business-related aspects of your question instead."
- Stay within: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce

Write responses that:
- Start with a direct 1–2 sentence answer tailored to the user's message and this idea.
- Keep the whole reply under ~120 words unless the user explicitly asks for more.
- Choose formatting based on intent (do not always use bullets):
  • Paragraph for explanations/opinions.
  • Bullet list only when enumerating options/tips.
  • Numbered steps only for clear "how to" requests or plans.
  • Simple table (Markdown) only if the user asks to compare.
- Be specific, actionable, and reference the idea details when helpful.
- Avoid fluff, headings, or repeating the question.
- If key info is missing, end with one brief clarifying question on a new line prefixed with "Quick check:"`;

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      // Add chat history
      chatHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      const response = await this.generateChatCompletion(messages);
      return response;
    } catch (error) {
      this.logger.error('Error in AI chat:', error);
      throw new Error('Failed to generate AI chat response');
    }
  }

  private buildRefinementPrompt(
    originalContent: any,
    refinementAspect: string,
    promptConfig: any,
    options: any,
  ): { systemPrompt: string; userPrompt: string } {
    if (!promptConfig?.refinementTemplates?.[refinementAspect]) {
      throw new Error(
        `Missing refinement template for aspect '${refinementAspect}' in database configuration`,
      );
    }

    // Use the exact structured refinement template from the database
    const systemPrompt: string = promptConfig.refinementTemplates[
      refinementAspect
    ] as string;

    // Create user prompt that provides the business idea context
    const userPrompt = `Business Idea: "${originalContent.title || 'Untitled'}"

Description: ${originalContent.description || originalContent.content || 'No description provided'}

Please analyze this business idea and provide your response following the EXACT format specified in the system prompt above. Use the structured format with emoji headers and bullet points as defined.`;

    return { systemPrompt, userPrompt };
  }
}
