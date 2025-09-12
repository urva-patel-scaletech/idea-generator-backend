import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Messages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Create new message' })
  @ApiBody({ type: CreateMessageDto })
  @Post()
  create(
    @GetCurrentUser() user: AuthenticatedUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.createByUser(createMessageDto, user.id);
  }

  @ApiOperation({ summary: 'Send message to thread' })
  @ApiBody({ type: SendMessageDto })
  @Post('send')
  sendMessage(
    @GetCurrentUser() user: AuthenticatedUser,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.messagesService.sendMessageByUser(sendMessageDto, user.id);
  }

  @ApiOperation({ summary: 'Get messages by thread ID' })
  @Get('thread/:threadId')
  findByThread(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('threadId', ParseUUIDPipe) threadId: string,
  ) {
    return this.messagesService.findByThreadForUser(threadId, user.id);
  }

  @ApiOperation({ summary: 'Get message by ID' })
  @Get(':id')
  findOne(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messagesService.findOneByUser(id, user.id);
  }

  @ApiOperation({ summary: 'Delete message' })
  @Delete(':id')
  remove(
    @GetCurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messagesService.removeByUser(id, user.id);
  }
}
