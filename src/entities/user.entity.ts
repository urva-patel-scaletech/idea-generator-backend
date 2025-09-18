import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Thread } from './thread.entity';

@Entity('users')
@Index(['deviceId', 'platform', 'isAnonymous'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deviceId?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  platform?: string; // 'web' | 'mobile'

  @Column({ type: 'timestamp', nullable: true })
  authenticatedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Thread, (thread) => thread.user)
  threads: Thread[];
}
