import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity('study_plans')
export class StudyPlan {


 @PrimaryColumn()
  userId: string;



  // Store the generated plan as JSON
  @Column({ type: 'jsonb' })
  plan: any;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
