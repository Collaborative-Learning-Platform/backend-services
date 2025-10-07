import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_streak')
export class UserStreak {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid')
  user_id: string;

  @Column('int', { default: 0 })
  current_streak_days: number;

  @Column('int', { default: 0 })
  longest_streak_days: number;

  @Column('date', { nullable: true })
  last_active_date?: Date;
}
