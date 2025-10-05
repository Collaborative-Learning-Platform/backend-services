import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDate,
  IsObject,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizAttemptDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  attempt_no: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  score: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  time_taken: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  submitted_at: Date;

  @IsObject()
  @IsOptional()
  answers?: any;
}
