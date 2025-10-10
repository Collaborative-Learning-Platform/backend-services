import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  chatId: string;

  @Column()
  sender: string;

  @Column()
  roomId: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
