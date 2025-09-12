import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IndustryType,
  ComplexityLevel,
  ToneType,
  TargetAudience,
  UrgencyLevel,
  BudgetRange,
  RefinementAspect,
  ShareDuration,
} from '../../common/enums/generate.enums';

export class GenerateDto {
  @ApiProperty({
    description: 'Assistant ID or app type',
    example: 'uuid-assistant-id',
  })
  @IsString()
  appId: string;

  @ApiProperty({
    description: 'User message for generation',
    example: 'I want to start something in testing',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional overrides (advanced usage)',
    example: { industry: 'tech', count: 8, complexity: 'medium' },
  })
  @IsOptional()
  @IsObject()
  overrides?: {
    industry?: IndustryType;
    count?: number;
    complexity?: ComplexityLevel;
    tone?: ToneType;
    targetAudience?: TargetAudience;
    urgency?: UrgencyLevel;
    budgetRange?: BudgetRange;
  };
}

export class RefineDto {
  @ApiProperty({
    description: 'ID of the specific card to refine',
    example: 'uuid-card-id',
  })
  @IsString()
  cardId: string;

  @ApiProperty({
    description: 'Aspect to refine',
    enum: RefinementAspect,
    example: RefinementAspect.BUSINESS_MODEL,
  })
  @IsEnum(RefinementAspect)
  aspect: RefinementAspect;

  @ApiPropertyOptional({
    description: 'Additional options for refinement',
    example: { depth: 'detailed' },
  })
  @IsOptional()
  @IsObject()
  options?: any;
}

export class SaveIdeaDto {
  @ApiProperty({
    description: 'ID of the idea to save',
    example: '1',
  })
  @IsString()
  ideaId: string;

  @ApiPropertyOptional({
    description: 'Custom title for saved idea',
  })
  @IsOptional()
  @IsString()
  customTitle?: string;
}

export class ShareIdeaDto {
  @ApiProperty({
    description: 'ID of the idea to share',
    example: '1',
  })
  @IsString()
  ideaId: string;

  @ApiPropertyOptional({
    description: 'Share settings',
    example: { public: true, expiresIn: '7d' },
  })
  @IsOptional()
  @IsObject()
  shareSettings?: {
    public?: boolean;
    expiresIn?: ShareDuration;
    allowComments?: boolean;
    password?: string;
  };
}

export class ChatWithAiDto {
  @ApiProperty({
    description: 'ID of the specific card to chat about',
    example: 'uuid-card-id',
  })
  @IsString()
  cardId: string;

  @ApiProperty({
    description: 'User message for the AI chat',
    example: 'How can I validate this business idea?',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'Previous chat history for context',
    example: [
      { role: 'user', content: 'Tell me about this idea' },
      { role: 'assistant', content: 'This is a great chess tournament idea...' }
    ],
  })
  @IsOptional()
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }>;
}
