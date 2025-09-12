import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Thread ID to send message to',
    example: 'uuid-thread-id',
  })
  @IsNotEmpty()
  @IsUUID()
  threadId: string;

  @ApiProperty({
    description: 'Message content to send',
    example: 'Hello, I need help with my project',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
