import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique,OneToMany } from "typeorm";
import { Workspace } from "./workspace.entity";
import { UserGroup } from "./user-group.entity";

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

    @Column({type:'uuid'})
    createdBy: string;

    // @Unique(["workspaceId", "name"])

    @ManyToOne(() => Workspace, workspace => workspace.groups, { onDelete: "CASCADE" })
    @JoinColumn({ name: 'workspaceId' })
    workspace: Workspace;

    @OneToMany(() => UserGroup, userGroup => userGroup.group)
    userGroups: UserGroup[];

    
}
