import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ThreadStage } from '../common/enums';
import { User } from './user.entity';
import { Assistant } from './assistant.entity';

@Entity('threads')
export class Thread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  assistantId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({
    type: 'enum',
    enum: ThreadStage,
    default: ThreadStage.IDEA,
  })
  stage: ThreadStage;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.threads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Assistant, (assistant) => assistant.threads)
  @JoinColumn({ name: 'assistantId' })
  assistant: Assistant;

  @OneToMany('Message', 'thread')
  messages: any[];
}
