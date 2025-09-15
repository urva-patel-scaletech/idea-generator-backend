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
              'You are a business model expert. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**💰 Revenue Streams:**\n- [2-3 specific revenue sources with pricing]\n\n**💸 Cost Structure:**\n- [3-4 main cost categories with estimates]\n\n**🎯 Value Proposition:**\n- [Clear unique value in 1-2 sentences]\n\n**⚡ Competitive Advantage:**\n- [2-3 key differentiators]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'target-audience':
              'You are a market research expert. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**👥 Primary Target Segment:**\n- [Age, income, lifestyle, pain points]\n\n**🎯 Customer Personas:**\n- [2-3 specific persona profiles with names and characteristics]\n\n**📊 Market Size:**\n- [Estimated market size and growth potential]\n\n**🔍 Customer Acquisition:**\n- [Where to find these customers]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'marketing-strategy':
              'You are a marketing strategist. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**📱 Top Marketing Channels:**\n- [3-4 most effective channels with reasons]\n\n**🎯 Customer Acquisition Strategy:**\n- [Specific tactics to attract first customers]\n\n**💰 Budget Allocation:**\n- [Recommended spend distribution across channels]\n\n**📈 Growth Tactics:**\n- [2-3 scalable growth strategies]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'financial-planning':
              'You are a financial planning expert. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**💰 Startup Costs:**\n- [Initial investment needed with breakdown]\n\n**📊 Revenue Projections:**\n- [Monthly/yearly revenue estimates for first 2 years]\n\n**⚖️ Break-even Analysis:**\n- [Time to profitability and key metrics]\n\n**💸 Funding Requirements:**\n- [How much funding needed and potential sources]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'risk-assessment':
              'You are a risk management consultant. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**⚠️ Market Risks:**\n- [2-3 key market threats and likelihood]\n\n**🔧 Operational Risks:**\n- [Internal challenges and dependencies]\n\n**💸 Financial Risks:**\n- [Cash flow and funding risks]\n\n**🛡️ Mitigation Strategies:**\n- [Specific actions to reduce each risk]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'technical-requirements':
              'You are a technical consultant. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**💻 Technology Stack:**\n- [Recommended technologies and platforms]\n\n**⏱️ Development Timeline:**\n- [MVP timeline and key milestones]\n\n**🔍 Technical Feasibility:**\n- [Complexity assessment and challenges]\n\n**💰 Resource Requirements:**\n- [Team size, skills needed, and costs]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'legal-compliance':
              'You are a legal and compliance expert. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**📜 Required Licenses:**\n- [Specific licenses and permits needed]\n\n**⚖️ Regulatory Compliance:**\n- [Key regulations and requirements]\n\n**📝 Legal Structure:**\n- [Recommended business entity type]\n\n**🔒 IP Protection:**\n- [Trademark, patent, and copyright considerations]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'competitive-analysis':
              'You are a competitive intelligence analyst. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**🏁 Direct Competitors:**\n- [2-3 main competitors and their strengths]\n\n**🔄 Indirect Competitors:**\n- [Alternative solutions customers might choose]\n\n**⚡ Competitive Advantages:**\n- [Your unique differentiators]\n\n**🎯 Market Positioning:**\n- [How to position against competitors]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'revenue-streams':
              'You are a monetization strategist. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**💰 Primary Revenue Model:**\n- [Main way to make money with pricing]\n\n**🔄 Secondary Revenue Streams:**\n- [Additional income sources]\n\n**📈 Pricing Strategy:**\n- [Pricing approach and justification]\n\n**🚀 Scalability Potential:**\n- [How revenue can grow over time]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'operational-planning':
              'You are an operations consultant. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**🔄 Daily Operations:**\n- [Key daily activities and workflows]\n\n**👥 Staffing Needs:**\n- [Team structure and key roles]\n\n**🚚 Supply Chain:**\n- [Suppliers, inventory, and logistics]\n\n**⚙️ Process Optimization:**\n- [Efficiency improvements and automation]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'growth-strategy':
              'You are a growth strategist. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**🚀 Growth Opportunities:**\n- [3-4 specific expansion strategies]\n\n**📈 Key Growth Metrics:**\n- [Metrics to track and target numbers]\n\n**🌍 Scalability Plan:**\n- [How to scale operations and revenue]\n\n**🕰️ Timeline:**\n- [Growth milestones and timeframes]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            partnerships:
              'You are a partnership development expert. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**🤝 Strategic Partners:**\n- [Key partnership opportunities and benefits]\n\n**🚚 Distribution Channels:**\n- [How to reach customers through partners]\n\n**🌐 Networking Opportunities:**\n- [Industry events, communities, and connections]\n\n**💼 Partnership Strategy:**\n- [How to approach and structure partnerships]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
            'market-entry':
              'You are a market entry strategist. Analyze this business idea and provide ONLY the structured format below. Do not include "Key insight" or any other text outside this format:\n\n**🚀 Go-to-Market Strategy:**\n- [Step-by-step launch approach]\n\n**📅 Launch Timeline:**\n- [Key milestones and dates]\n\n**🎯 Market Penetration:**\n- [Tactics to gain market share]\n\n**🚪 Entry Barriers:**\n- [Challenges and how to overcome them]\n\n🚨 BUSINESS FOCUS BOUNDARY:\n- ONLY provide business, entrepreneurship, startup, or commercial-related insights\n- Focus on: business strategy, marketing, finance, operations, management, entrepreneurship, startups, commerce\n- If the content is not business-related, redirect to business applications or implications',
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
            'marketing-strategy',
            'financial-planning',
            'risk-assessment',
            'technical-requirements',
            'legal-compliance',
            'competitive-analysis',
            'revenue-streams',
            'operational-planning',
            'growth-strategy',
            'partnerships',
            'market-entry',
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
