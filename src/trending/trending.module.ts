import { Module } from '@nestjs/common';
import { TrendingController } from './trending.controller';
import { TrendingService } from './trending.service';
import { OpenAiModule } from '../openai/openai.module';

@Module({
  imports: [OpenAiModule],
  controllers: [TrendingController],
  providers: [TrendingService],
  exports: [TrendingService],
})
export class TrendingModule {}
