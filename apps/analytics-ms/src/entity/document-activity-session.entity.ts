import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('document_activity_session')
export class DocumentActivitySession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  document_name: string;

  @Column('timestamp')
  started_at: Date;

  @Column('timestamp', { nullable: true })
  ended_at?: Date;

  @Column('int', { nullable: true })
  peak_connections?: number;
}
