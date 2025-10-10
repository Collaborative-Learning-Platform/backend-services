import { IsEnum, IsInt, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { QuestionType } from './create-quiz-question.dto';

export class UpdateQuizQuestionDto {
  @IsInt()
  question_no: number;

  @IsUUID()
  quizId: string;

  @IsEnum(QuestionType)
  @IsOptional()
  question_type?: QuestionType;

  @IsOptional()
  question?: any;

  @IsOptional()
  correct_answer?: any;
}
