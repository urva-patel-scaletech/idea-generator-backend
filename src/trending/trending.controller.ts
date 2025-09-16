import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrendingService, TrendingIdea } from './trending.service';

@ApiTags('Trending')
@Controller('trending')
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current trending business ideas' })
  @ApiResponse({
    status: 200,
    description: 'Trending ideas retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            title: 'AI-Powered Personal Assistant',
            description: 'Smart assistant that helps manage daily tasks',
            category: 'Technology',
          },
        ],
      }
    }
  })
  async getTrendingIdeas(): Promise<TrendingIdea[]> {
    return this.trendingService.getTrendingIdeas();
  }
}
