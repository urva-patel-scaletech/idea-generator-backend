import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant } from '../entities/assistant.entity';
import { AssistantCategory } from '../common/enums';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Assistant)
    private readonly assistantRepository: Repository<Assistant>,
  ) {}

  async seedAssistants() {
    const existingAssistants = await this.assistantRepository.count();
    if (existingAssistants > 0) {
      this.logger.log('Assistants already seeded');
      return;
    }

    const assistants = [
      {
        name: 'Idea Generator Pro',
        category: AssistantCategory.IDEA,
        description: 'AI-powered business idea generator for any industry',
        systemPrompt:
          'You are an expert business consultant specializing in innovative idea generation.',
        appType: 'idea-generator',
        promptConfig: {
          systemTemplate: `You are an expert business consultant specializing in the {{industry}} industry.
Generate exactly {{count}} innovative, viable business ideas based on user input.
Each idea must include: compelling title, detailed description, market viability score (1-10), and implementation complexity.
Focus on current market trends and emerging opportunities.

🚨 BUSINESS FOCUS BOUNDARY:
- ONLY provide business, entrepreneurship, startup, or commercial-related responses
- If asked about non-business topics (personal advice, entertainment, general knowledge, etc.), politely redirect to business context
- Example: "I focus on business solutions. Let me help you with business-related aspects of your question instead."
- Stay within: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce

Return response as valid JSON array with this exact structure:
[
  {
    "title": "string",
    "description": "string (2-3 sentences)",
    "score": number,
    "complexity": "low|medium|high"
  }
]`,
          userTemplate: `Based on this interest: "{{input}}", generate {{count}} business ideas that:
1. Address real market needs in the {{industry}} industry
2. Are technically feasible with current technology
3. Have clear monetization potential
4. Can be started with reasonable resources
5. Leverage current market trends

Generate ideas now:`,
          refinementTemplates: {
            'business-model':
              'You are a business model expert. Analyze the revenue streams, cost structure, value proposition, and competitive advantages for this business idea.\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'target-audience':
              'You are a market research expert. Define the target audience, customer segments, demographics, and user personas for this business idea.\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'marketing-channels':
              'You are a marketing strategist. Identify the most effective marketing channels, customer acquisition strategies, and promotional tactics for this business idea.\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
          },
          parameterInferencePrompt: `Extract key parameters from the user message. Be conservative - only extract parameters that are explicitly mentioned.\n\nExtract these parameters if clearly specified:\n- industry: tech, healthcare, finance, education, retail, food, travel, fashion, sports, automotive, real-estate, entertainment, other\n- count: only if explicitly mentioned with numbers ("3 ideas", "5 suggestions")\n- complexity: simple, moderate, complex (only if implied by words like "simple", "basic", "advanced")\n- tone: professional, casual, creative (only if clearly indicated)\n- target_audience: if specifically mentioned\n- urgency: low, medium, high (only if time constraints mentioned)\n- budget_range: if financial constraints mentioned\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY extract parameters for business, entrepreneurship, startup, or commercial contexts\n- If the request is not business-related, return empty object {}\n\nExamples:\n- "I want to start something in AI" → {"industry": "tech"}\n- "Give me 3 food business ideas" → {"count": 3, "industry": "food"}\n- "Simple startup concepts" → {"complexity": "simple"}\n- "I need some ideas" → {}\n- "What's the weather like?" → {} (not business-related)\n\nReturn only valid JSON object with extracted parameters or empty object {}.`,
        },
        outputFormat: {
          type: 'array',
          structure: {
            title: 'string',
            description: 'string',
            score: 'number',
            complexity: 'string',
          },
        },
        appSettings: {
          defaultCount: 6,
          industries: [
            'tech',
            'healthcare',
            'finance',
            'education',
            'retail',
            'manufacturing',
          ],
          refinementOptions: [
            'business-model',
            'target-audience',
            'marketing-channels',
          ],
          complexityLevels: ['low', 'medium', 'high'],
        },
      },
      {
        name: 'Strategy Advisor',
        category: AssistantCategory.STRATEGY,
        description: 'Provides strategic business guidance',
        systemPrompt:
          'You are a strategic business advisor who helps companies develop comprehensive business strategies and roadmaps.',
        appType: 'strategy-advisor',
        promptConfig: {
          systemTemplate:
            'You are a strategic business advisor. Provide comprehensive strategic guidance.\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related responses\n- If asked about non-business topics (personal advice, entertainment, general knowledge, etc.), politely redirect to business context\n- Example: "I focus on business solutions. Let me help you with business-related aspects of your question instead."\n- Stay within: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce',
          userTemplate:
            'Analyze and provide strategic business advice for: {{input}}\n\nFocus on business strategy, market analysis, competitive positioning, growth opportunities, and operational excellence.',
        },
        outputFormat: {
          type: 'object',
          structure: {
            analysis: 'string',
            recommendations: 'array',
            risks: 'array',
          },
        },
        appSettings: {
          focusAreas: [
            'market-analysis',
            'competitive-strategy',
            'growth-planning',
          ],
        },
      },
    ];

    await this.assistantRepository.save(assistants);
    this.logger.log('Assistants seeded successfully');
  }
}
