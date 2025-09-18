import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from '../entities/message.entity';
import { ThreadsModule } from '../threads/threads.module';
import { OpenAiModule } from '../openai/openai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), ThreadsModule, OpenAiModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
