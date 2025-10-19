import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class PasswordResetToken {

  @PrimaryColumn({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ nullable: false })
  token: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;
}
