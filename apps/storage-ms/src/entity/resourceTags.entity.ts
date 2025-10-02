import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity';

@Entity('resource_tags')
export class ResourceTag {
  @PrimaryGeneratedColumn('uuid')
  tagId: string;

  @Column()
  tag: string;

  @Column()
  resourceId: string;

  @ManyToOne(() => Resource, (resource) => resource.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;
}
