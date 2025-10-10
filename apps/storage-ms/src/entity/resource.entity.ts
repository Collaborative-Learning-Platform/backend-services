import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ResourceTag } from './resourceTags.entity';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  resourceId: string;

  @Column()
  groupId: string;

  @Column()
  userId: string;

  @Column()
  fileName: string;

  @Column()
  s3Key: string;

  @Column({nullable: true})
  description: string;

  @Column({ nullable: true })
  contentType: string;

  @Column({ nullable: true })
  size: number;

  @Column({nullable: true})
  estimatedCompletionTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ResourceTag, (tag) => tag.resource, { cascade: true })
  tags: ResourceTag[];
}
