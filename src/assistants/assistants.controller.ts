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
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssistantsService } from './assistants.service';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';
import { AssistantCategory } from '../common/enums';

@ApiTags('Assistants')
@Controller('assistants')
@ApiBearerAuth()
export class AssistantsController {
  constructor(private readonly assistantsService: AssistantsService) {}

  @ApiOperation({ summary: 'Create new assistant' })
  @ApiBody({ type: CreateAssistantDto })
  @Post()
  create(@Body() createAssistantDto: CreateAssistantDto) {
    return this.assistantsService.create(createAssistantDto);
  }

  @ApiOperation({ summary: 'Get all assistants' })
  @ApiQuery({ name: 'category', required: false, enum: AssistantCategory, description: 'Filter by category' })
  @Get()
  findAll(@Query('category') category?: AssistantCategory) {
    if (category) {
      return this.assistantsService.findByCategory(category);
    }
    return this.assistantsService.findAll();
  }

  @ApiOperation({ summary: 'Get assistant by ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assistantsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update assistant' })
  @ApiBody({ type: UpdateAssistantDto })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssistantDto: UpdateAssistantDto,
  ) {
    return this.assistantsService.update(id, updateAssistantDto);
  }

  @ApiOperation({ summary: 'Deactivate assistant' })
  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.assistantsService.deactivate(id);
  }

  @ApiOperation({ summary: 'Activate assistant' })
  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.assistantsService.activate(id);
  }

  @ApiOperation({ summary: 'Delete assistant' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.assistantsService.remove(id);
  }
}
