import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';
import { Thread } from '../entities/thread.entity';
import { UsersModule } from '../users/users.module';
import { AssistantsModule } from '../assistants/assistants.module';

@Module({
  imports: [TypeOrmModule.forFeature([Thread]), UsersModule, AssistantsModule],
  controllers: [ThreadsController],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class ThreadsModule {}
