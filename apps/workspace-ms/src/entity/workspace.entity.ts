import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";


@Entity()
export class Workspace {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({type:'uuid'})
    createdBy: string;
}
