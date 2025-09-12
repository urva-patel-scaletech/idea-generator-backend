import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantsService } from './assistants.service';
import { AssistantsController } from './assistants.controller';
import { Assistant } from '../entities/assistant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assistant])],
  controllers: [AssistantsController],
  providers: [AssistantsService],
  exports: [AssistantsService],
})
export class AssistantsModule {}
