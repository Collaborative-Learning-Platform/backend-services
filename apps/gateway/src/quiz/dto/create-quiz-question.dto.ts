import { IsEnum, IsInt, IsNotEmpty, IsUUID } from "class-validator";

export enum QuestionType {
    MCQ = 'MCQ',
    SHORT_ANSWER = 'short_answer',
    TRUE_FALSE = 'true_false'
}

export class CreateQuizQuestionDto {
    @IsInt()
    @IsNotEmpty()
    question_no: number;

    @IsUUID()
    @IsNotEmpty()
    quizId: string;

    @IsEnum(QuestionType)
    @IsNotEmpty()
    question_type: QuestionType;

    @IsNotEmpty()
    question: any;

    @IsNotEmpty()
    correct_answer: any;

}