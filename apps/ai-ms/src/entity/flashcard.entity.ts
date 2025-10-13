import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export class FlashcardContent {
  id: number;
  front: string;
  back: string;
}

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  flashcardId: string;

  @Column()
  title: string;

  @Column()
  subject: string;

  @Column({ type: 'int', default: 0 })
  cardCount: number;

  // Store AI-generated flashcard content as JSON (front/back pairs)
  @Column({ type: 'jsonb', nullable: true })
  flashcardContent: FlashcardContent[];

  @Column()
  userId: string;

  @Column()
  resourceId: string;

  @CreateDateColumn()
  createdAt: Date;
}
