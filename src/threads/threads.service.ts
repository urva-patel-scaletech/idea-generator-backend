import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thread } from '../entities/thread.entity';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UsersService } from '../users/users.service';
import { AssistantsService } from '../assistants/assistants.service';

@Injectable()
export class ThreadsService {
  constructor(
    @InjectRepository(Thread)
    private readonly threadRepository: Repository<Thread>,
    private readonly usersService: UsersService,
    private readonly assistantsService: AssistantsService,
  ) {}

  async create(
    createThreadDto: CreateThreadDto,
    userId: string,
  ): Promise<Thread> {
    // Validate user and assistant exist
    await this.usersService.findOne(userId);
    await this.assistantsService.findOne(createThreadDto.assistantId);

    const thread = this.threadRepository.create({
      ...createThreadDto,
      userId,
    });
    return this.threadRepository.save(thread);
  }

  async findAll(): Promise<Thread[]> {
    return this.threadRepository.find({
      relations: ['user', 'assistant'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Thread[]> {
    await this.usersService.findOne(userId); // Validate user exists

    return this.threadRepository.find({
      where: { userId },
      relations: ['assistant'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findByAssistant(assistantId: string): Promise<Thread[]> {
    await this.assistantsService.findOne(assistantId); // Validate assistant exists

    return this.threadRepository.find({
      where: { assistantId },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findByUserAndAssistant(
    userId: string,
    assistantId: string,
  ): Promise<Thread[]> {
    await this.usersService.findOne(userId);
    await this.assistantsService.findOne(assistantId);

    return this.threadRepository.find({
      where: { userId, assistantId },
      relations: ['assistant'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Thread> {
    const thread = await this.threadRepository.findOne({
      where: { id },
      relations: ['user', 'assistant', 'messages'],
    });

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }

    return thread;
  }

  async findOneByUser(id: string, userId: string): Promise<Thread> {
    const thread = await this.threadRepository.findOne({
      where: { id, userId },
      relations: ['user', 'assistant', 'messages'],
    });

    if (!thread) {
      throw new NotFoundException(
        `Thread with ID ${id} not found or you don't have access to it`,
      );
    }

    return thread;
  }

  async update(id: string, updateThreadDto: UpdateThreadDto): Promise<Thread> {
    await this.threadRepository.update(id, updateThreadDto);
    return this.findOne(id);
  }

  async updateByUser(
    id: string,
    updateThreadDto: UpdateThreadDto,
    userId: string,
  ): Promise<Thread> {
    // First verify user owns the thread
    await this.findOneByUser(id, userId);
    // Then update it
    await this.threadRepository.update(id, updateThreadDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const thread = await this.findOne(id);
    await this.threadRepository.remove(thread);
  }

  async removeByUser(id: string, userId: string): Promise<void> {
    // First verify user owns the thread
    const thread = await this.findOneByUser(id, userId);
    // Then remove it
    await this.threadRepository.remove(thread);
  }

  async updateSummary(id: string, summary: string): Promise<Thread> {
    await this.threadRepository.update(id, { summary });
    return this.findOne(id);
  }
}
