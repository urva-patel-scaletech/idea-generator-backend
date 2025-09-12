import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Assistant } from '../entities/assistant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assistant])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
