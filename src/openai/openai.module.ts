import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiService } from './openai.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [ConfigModule, GeminiModule],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
