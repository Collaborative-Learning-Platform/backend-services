import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('daily_active_users')
export class DailyActiveUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  date: Date;

  @Column('int', { default: 0 })
  active_users: number;

  @Column('int', { default: 0 })
  total_users: number;

  @Column('float', { default: 0 })
  engagement: number; // Store as percentage (e.g., 24.5)
}
