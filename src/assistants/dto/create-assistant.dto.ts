import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssistantCategory } from '../../common/enums';

export class CreateAssistantDto {
  @ApiProperty({
    description: 'Assistant name',
    example: 'Business Idea Generator',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Assistant category',
    enum: AssistantCategory,
    example: AssistantCategory.IDEA,
  })
  @IsEnum(AssistantCategory)
  category: AssistantCategory;

  @ApiProperty({
    description: 'Assistant description',
    example: 'Generates creative business ideas based on user input',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'System prompt for the assistant',
    example: 'You are a business idea generator...',
  })
  @IsNotEmpty()
  @IsString()
  systemPrompt: string;

  @ApiPropertyOptional({
    description: 'Whether the assistant is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
