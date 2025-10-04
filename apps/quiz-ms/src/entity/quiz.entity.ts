import {
  Column,
  Entity,
  // ManyToOne,
  PrimaryGeneratedColumn,
  // JoinColumn,
} from 'typeorm';

@Entity('quiz')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  quizId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: false })
  groupId: string;

  
  @Column({ type: 'uuid', nullable: false })
  createdById: string;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'int', default: 0 })
  timeLimit: number; // in minutes
}

