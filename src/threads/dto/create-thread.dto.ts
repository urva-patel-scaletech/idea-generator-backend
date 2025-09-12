import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ThreadStage } from '../../common/enums';

export class CreateThreadDto {
  @ApiProperty({
    description: 'Assistant ID to create thread for',
    example: 'uuid-assistant-id',
  })
  @IsNotEmpty()
  @IsUUID()
  assistantId: string;

  @ApiProperty({
    description: 'Thread title',
    example: 'My New Project Discussion',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Thread summary',
    example: 'Discussion about implementing a new feature',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Thread stage',
    enum: ThreadStage,
    example: ThreadStage.IDEA,
  })
  @IsOptional()
  @IsEnum(ThreadStage)
  stage?: ThreadStage = ThreadStage.IDEA;
}
