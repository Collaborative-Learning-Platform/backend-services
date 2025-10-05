import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class GenerateStudyPlanDto {
  @IsString()
  userId: string;

 @IsString()
 studyGoal: string;

 @IsString()
 goalDescription: string;

 @IsString()
 overallTimePerDay: string;

 @IsObject()
 dailyTimeAvailability: Record<string, string>;
}
