import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity('quiz_question')
export class QuizQuestion {
  @PrimaryColumn()
  question_no: number;

  @PrimaryColumn()
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.quizId, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({ type: 'enum', enum: ['MCQ', 'short_answer', 'true_false'] })
  question_type: string;

  @Column({ type: 'json' })
  question: any;

  @Column({ type: 'json' })
  correct_answer: any;
}
