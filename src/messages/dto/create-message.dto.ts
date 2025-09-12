import { IsNotEmpty, IsString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageSender } from '../../common/enums';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Thread ID where the message belongs',
    example: 'uuid-thread-id',
  })
  @IsNotEmpty()
  @IsUUID()
  threadId: string;

  @ApiProperty({
    description: 'Message sender type',
    enum: MessageSender,
    example: MessageSender.USER,
  })
  @IsEnum(MessageSender)
  sender: MessageSender;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how can I help you?',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
