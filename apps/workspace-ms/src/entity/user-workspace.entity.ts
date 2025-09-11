import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Workspace } from "./workspace.entity";

@Entity()
export class UserWorkspace {
  @PrimaryColumn({ type: "uuid" })
  userId: string;

  @PrimaryColumn()
  workspaceId: string;

  @CreateDateColumn()
  joinedAt: Date;

// relationships
  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;
}
