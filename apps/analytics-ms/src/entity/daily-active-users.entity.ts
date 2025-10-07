import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('daily_active_users')
export class DailyActiveUsers {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  date: Date;

  @Column('int', { default: 0 })
  active_users: number;

  @Column('float', { default: 0 })
  avg_session_minutes: number;
}
