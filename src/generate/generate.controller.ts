import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { GenerateService } from './generate.service';
import { DeviceService } from '../common/services/device.service';
import { AnonymousUserService } from '../users/anonymous-user.service';
import {
  GenerateDto,
  RefineDto,
  SaveIdeaDto,
  ShareIdeaDto,
  ChatWithAiDto,
} from './dto/generate.dto';

@ApiTags('Generate')
@Controller('generate')
export class GenerateController {
  constructor(
    private readonly generateService: GenerateService,
    private readonly deviceService: DeviceService,
    private readonly anonymousUserService: AnonymousUserService,
  ) {}

  private async getUserId(req: any): Promise<string> {
    if (req.user?.id) {
      return req.user.id;
    } else {
      const deviceInfo = this.deviceService.extractDeviceInfo(req);
      return await this.anonymousUserService.getOrCreateAnonymousUser(
        deviceInfo,
      );
    }
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Generate content for any app type' })
  @ApiBody({ type: GenerateDto })
  @ApiResponse({
    status: 201,
    description: 'Content generated successfully',
    schema: {
      example: {
        success: true,
        data: {
          threadId: 'uuid',
          appType: 'idea-generator',
          results: [
            {
              title: 'Smart Testing Analytics Platform',
              description: 'AI-powered dashboard for testing insights',
              score: 8.5,
              complexity: 'simple',
            },
          ],
          refinementOptions: ['business-model', 'target-audience'],
        },
      },
    },
  })
  async generate(@Request() req: any, @Body() generateDto: GenerateDto) {
    let userId: string;

    if (req.user?.id) {
      // Authenticated user
      userId = req.user.id;
    } else {
      // Anonymous user - get or create device-specific user
      const deviceInfo = this.deviceService.extractDeviceInfo(req);
      userId =
        await this.anonymousUserService.getOrCreateAnonymousUser(deviceInfo);
    }

    return this.generateService.generateContent(userId, generateDto);
  }

  @Post(':threadId/refine')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Refine generated content' })
  @ApiBody({ type: RefineDto })
  @ApiResponse({
    status: 200,
    description: 'Content refined successfully',
    schema: {
      example: {
        success: true,
        data: {
          threadId: 'uuid',
          aspect: 'business-model',
          refinedContent: {
            revenueStreams: ['Subscription', 'Enterprise licenses'],
            targetMarket: 'Software development teams',
            competitiveAdvantage: 'AI-powered insights',
          },
        },
      },
    },
  })
  async refine(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Body() refineDto: RefineDto,
  ) {
    let userId: string;

    if (req.user?.id) {
      userId = req.user.id;
    } else {
      const deviceInfo = this.deviceService.extractDeviceInfo(req);
      userId =
        await this.anonymousUserService.getOrCreateAnonymousUser(deviceInfo);
    }

    return this.generateService.refineContent(userId, threadId, refineDto);
  }

  @Post(':threadId/save')
  @ApiOperation({ summary: 'Save a specific idea' })
  @ApiBody({ type: SaveIdeaDto })
  @ApiResponse({
    status: 200,
    description: 'Idea saved successfully',
  })
  async saveIdea(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Body() saveDto: SaveIdeaDto,
  ) {
    return this.generateService.saveIdea(req.user.id, threadId, saveDto);
  }

  @Post(':threadId/share')
  @ApiOperation({ summary: 'Share a specific idea' })
  @ApiBody({ type: ShareIdeaDto })
  @ApiResponse({
    status: 200,
    description: 'Idea shared successfully',
  })
  async shareIdea(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Body() shareDto: ShareIdeaDto,
  ) {
    return this.generateService.shareIdea(req.user.id, threadId, shareDto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending ideas' })
  @ApiResponse({
    status: 200,
    description: 'Trending ideas retrieved successfully',
  })
  async getTrending() {
    return this.generateService.getTrendingIdeas();
  }

  @Post(':threadId/chat')
  @ApiOperation({ summary: 'Chat with AI about a specific card' })
  @ApiBody({ type: ChatWithAiDto })
  @ApiResponse({
    status: 200,
    description: 'AI chat response generated successfully',
    schema: {
      example: {
        success: true,
        data: {
          threadId: 'uuid',
          cardId: 'card-uuid',
          userMessage: 'How can I validate this business idea?',
          aiResponse:
            'Here are some ways to validate your chess tournament idea...',
          timestamp: '2025-09-08T14:30:00Z',
        },
      },
    },
  })
  @UseGuards(OptionalJwtAuthGuard)
  async chatWithAi(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Body() chatDto: ChatWithAiDto,
  ) {
    let userId: string;

    if (req.user?.id) {
      userId = req.user.id;
    } else {
      const deviceInfo = this.deviceService.extractDeviceInfo(req);
      userId =
        await this.anonymousUserService.getOrCreateAnonymousUser(deviceInfo);
    }

    return this.generateService.chatWithAi(userId, threadId, chatDto);
  }

  @Get(':threadId/chat/:cardId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get chat history for a specific card' })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
  })
  async getChatHistoryByCard(
    @Request() req: any,
    @Param('threadId') threadId: string,
    @Param('cardId') cardId: string,
  ) {
    let userId: string;

    if (req.user?.id) {
      userId = req.user.id;
    } else {
      const deviceInfo = this.deviceService.extractDeviceInfo(req);
      userId =
        await this.anonymousUserService.getOrCreateAnonymousUser(deviceInfo);
    }

    return this.generateService.getChatHistoryByCard(userId, threadId, cardId);
  }

  @Get(':threadId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get thread details' })
  @ApiResponse({
    status: 200,
    description: 'Thread retrieved successfully',
  })
  async getThread(@Request() req: any, @Param('threadId') threadId: string) {
    let userId: string;

    if (req.user?.id) {
      userId = req.user.id;
    } else {
      const deviceInfo = this.deviceService.extractDeviceInfo(req);
      userId =
        await this.anonymousUserService.getOrCreateAnonymousUser(deviceInfo);
    }

    return this.generateService.getThread(userId, threadId);
  }
}
