import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

enum GroupType {
  MAIN = 'Main',
  CUSTOM = 'Custom',
}

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  groupId: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: GroupType, default: GroupType.MAIN })
  type: GroupType;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;
}
