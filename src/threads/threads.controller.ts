import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';

@ApiTags('Threads')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @ApiOperation({ summary: 'Create new thread' })
  @ApiBody({ type: CreateThreadDto })
  @Post()
  create(
    @GetCurrentUser() user: AuthenticatedUser,
    @Body() createThreadDto: CreateThreadDto,
  ) {
    return this.threadsService.create(createThreadDto, user.id);
  }

  @ApiOperation({ summary: 'Get all threads for current user' })
  @ApiQuery({
    name: 'assistantId',
    required: false,
    description: 'Filter by assistant ID',
  })
  @Get()
  findAll(
    @GetCurrentUser() user: AuthenticatedUser,
    @Query('assistantId') assistantId?: string,
  ) {
    // Always filter by the authenticated user's ID
    if (assistantId) {
      return this.threadsService.findByUserAndAssistant(user.id, assistantId);
    }
    return this.threadsService.findByUser(user.id);
  }

  @ApiOperation({ summary: 'Get thread by ID' })
  @Get(':id')
  findOne(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.threadsService.findOneByUser(id, user.id);
  }

  @ApiOperation({ summary: 'Update thread' })
  @ApiBody({ type: UpdateThreadDto })
  @Patch(':id')
  update(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateThreadDto: UpdateThreadDto,
  ) {
    // First verify user owns the thread, then update
    return this.threadsService.updateByUser(id, updateThreadDto, user.id);
  }

  @ApiOperation({ summary: 'Delete thread' })
  @Delete(':id')
  remove(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.threadsService.removeByUser(id, user.id);
  }
}
