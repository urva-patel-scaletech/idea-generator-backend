import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { Assistant } from '../entities/assistant.entity';
import { Thread } from '../entities/thread.entity';
import { User } from '../entities/user.entity';
import { Message } from '../entities/message.entity';
import { OpenAiModule } from '../openai/openai.module';
import { TrendingModule } from '../trending/trending.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assistant, Thread, User, Message]),
    OpenAiModule,
    TrendingModule,
    UsersModule,
  ],
  controllers: [GenerateController],
  providers: [GenerateService],
  exports: [GenerateService],
})
export class GenerateModule {}
