import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { UserActivityLog } from './user-activity-log.entity';

@Entity('user_activity_session')
export class UserActivitySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  activity_log_id: string; // Always linked to a UserActivityLog entry (type, metadata, etc.)

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column('timestamp', { nullable: true }) //Initially null upon record creation
  ended_at?: Date;

  @Column('int')
  duration_seconds: number;

  @OneToOne(() => UserActivityLog, (log) => log.sessions)
  @JoinColumn({ name: 'activity_log_id' })
  activity_log: UserActivityLog;
}
