import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { Workspace } from "./workspace.entity";

enum UserRole {
  TUTOR = "tutor",
  USER = "user",
} 

@Entity()
export class UserWorkspace {
  @PrimaryColumn({ type: "uuid" })
  userId: string;

  @PrimaryColumn()
  workspaceId: string;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

// relationships
  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;
}
