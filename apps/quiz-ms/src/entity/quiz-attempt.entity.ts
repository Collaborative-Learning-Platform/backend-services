import { JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Entity, Column } from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity('quiz_attempt')
export class QuizAttempt {
  @PrimaryColumn()
  quizId: string;

  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  attempt_no: number;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'float8' })
  score: number;

  @Column({ type: 'float8' })
  time_taken: number;

  @Column({ type: 'timestamp' })
  submitted_at: Date;

  @Column({ type: 'json' })
  answers: any;
}
