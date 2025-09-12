import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Group } from "./group.entity";

@Entity()
export class UserGroup {
  @PrimaryColumn({ type: "uuid" })
  userId: string;

  @PrimaryColumn()
  groupId: string;

  @CreateDateColumn()
  joinedAt: Date;

// relationships
  @ManyToOne(() => Group, { onDelete: "CASCADE" })
  @JoinColumn({ name: "groupId" })
  group: Group;
}
