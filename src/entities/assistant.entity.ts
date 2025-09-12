import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AssistantCategory } from '../common/enums';

@Entity('assistants')
export class Assistant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: AssistantCategory,
    default: AssistantCategory.IDEA,
  })
  category: AssistantCategory;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  systemPrompt: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50, default: 'idea-generator' })
  appType: string;

  @Column({ type: 'jsonb', nullable: true })
  promptConfig: any;

  @Column({ type: 'jsonb', nullable: true })
  outputFormat: any;

  @Column({ type: 'jsonb', nullable: true })
  appSettings: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany('Thread', 'assistant')
  threads: any[];
}
