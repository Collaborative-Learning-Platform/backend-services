import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";

@Entity()
export class RefreshToken {

  @PrimaryColumn({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ nullable: false })
  refresh_token: string;
    
  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;
}
