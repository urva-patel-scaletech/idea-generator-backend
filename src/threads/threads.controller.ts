import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { DeviceService } from '../common/services/device.service';
import { AnonymousUserService } from '../users/anonymous-user.service';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    id: string;
    email?: string;
  };
}

@ApiTags('Threads')
@UseGuards(OptionalJwtAuthGuard)
@ApiBearerAuth()
@Controller('threads')
export class ThreadsController {
  constructor(
    private readonly threadsService: ThreadsService,
    private readonly deviceService: DeviceService,
    private readonly anonymousUserService: AnonymousUserService,
  ) {}

  private async getUserId(req: AuthenticatedRequest): Promise<string> {
    if (req.user?.id) {
      return req.user.id;
    } else {
      const deviceInfo = this.deviceService.extractDeviceInfo(req as ExpressRequest);
      return await this.anonymousUserService.getOrCreateAnonymousUser(
        deviceInfo,
      );
    }
  }

  @ApiOperation({ summary: 'Create new thread' })
  @ApiBody({ type: CreateThreadDto })
  @Post()
  async create(@Body() createThreadDto: CreateThreadDto, @Request() req: AuthenticatedRequest) {
    const userId = await this.getUserId(req);
    return this.threadsService.create(createThreadDto, userId);
  }

  @ApiOperation({ summary: 'Get all threads for current user' })
  @ApiQuery({
    name: 'assistantId',
    required: false,
    description: 'Filter by assistant ID',
  })
  @Get()
  async findAll(@Query() query: any, @Request() req: AuthenticatedRequest) {
    const userId = await this.getUserId(req);
    // Always filter by the user's ID (authenticated or anonymous)
    if (query.assistantId) {
      return this.threadsService.findByUserAndAssistant(userId, query.assistantId);
    }
    return this.threadsService.findByUser(userId);
  }

  @ApiOperation({ summary: 'Get thread by ID' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    const userId = await this.getUserId(req);
    return this.threadsService.findOneByUser(id, userId);
  }

  @ApiOperation({ summary: 'Update thread' })
  @ApiBody({ type: UpdateThreadDto })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateThreadDto: UpdateThreadDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = await this.getUserId(req);
    // First verify user owns the thread, then update
    return this.threadsService.updateByUser(id, updateThreadDto, userId);
  }

  @ApiOperation({ summary: 'Delete thread' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    const userId = await this.getUserId(req);
    return this.threadsService.removeByUser(id, userId);
  }
}
