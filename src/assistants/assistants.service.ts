import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant } from '../entities/assistant.entity';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';
import { AssistantCategory } from '../common/enums';

@Injectable()
export class AssistantsService {
  constructor(
    @InjectRepository(Assistant)
    private readonly assistantRepository: Repository<Assistant>,
  ) {}

  async create(createAssistantDto: CreateAssistantDto): Promise<Assistant> {
    const assistant = this.assistantRepository.create(createAssistantDto);
    return this.assistantRepository.save(assistant);
  }

  async findAll(): Promise<Assistant[]> {
    return this.assistantRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findByCategory(category: AssistantCategory): Promise<Assistant[]> {
    return this.assistantRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Assistant> {
    const assistant = await this.assistantRepository.findOne({
      where: { id },
    });

    if (!assistant) {
      throw new NotFoundException(`Assistant with ID ${id} not found`);
    }

    return assistant;
  }

  async update(
    id: string,
    updateAssistantDto: UpdateAssistantDto,
  ): Promise<Assistant> {
    const assistant = await this.findOne(id);
    await this.assistantRepository.update(id, updateAssistantDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const assistant = await this.findOne(id);
    await this.assistantRepository.remove(assistant);
  }

  async deactivate(id: string): Promise<Assistant> {
    await this.update(id, { isActive: false });
    return this.findOne(id);
  }

  async activate(id: string): Promise<Assistant> {
    await this.update(id, { isActive: true });
    return this.findOne(id);
  }
}
