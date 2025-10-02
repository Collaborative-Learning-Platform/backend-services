import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { IsUUID } from 'class-validator';

@Entity({ name: 'documents' })
export class Document {
  @PrimaryGeneratedColumn('uuid')
  documentId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120, nullable: false })
  name: string; // e.g. `${groupId}-${documentId}` (room name)

  @Column({ type: 'varchar', length: 255, default: 'Untitled Document' })
  title: string;

  @Column({ type: 'bytea', nullable: true })
  data: Buffer | null; // Yjs binary/state

  // --- Group (store only groupId)
  @Column({ type: 'uuid' })
  @IsUUID()
  groupId: string;

  // --- CreatedBy (metadata only, store userId as UUID)
  @Column({ type: 'uuid' })
  @IsUUID()
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastEdited: Date;

  @Column('uuid', { array: true, default: [] })
  contributorIds: string[];

  //   // --- Contributors (this WILL be queried)
  //   @ManyToMany(() => User)
  //   @JoinTable({
  //     name: 'document_contributors', // join table name
  //     joinColumn: { name: 'documentId', referencedColumnName: 'documentId' },
  //     inverseJoinColumn: { name: 'userId', referencedColumnName: 'userId' },
  //   })
  //   contributors: User[];

  // --- Contributors (store only userIds)
}
