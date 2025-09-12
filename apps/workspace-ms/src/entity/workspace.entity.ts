import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from "typeorm";
import { UserWorkspace } from "./user-workspace.entity";


@Entity()
export class Workspace {
    @PrimaryGeneratedColumn("uuid")
    workspaceId: string;
    
    @Column({ unique: true })
    name: string;

    @Column()
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({type:'uuid'})
    createdBy: string;

    @OneToMany(() => UserWorkspace, userWorkspace => userWorkspace.workspace)
    userWorkspaces: UserWorkspace[];
    
}
