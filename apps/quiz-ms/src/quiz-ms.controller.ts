import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QuizMsService } from './quiz-ms.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';

@Controller()
export class QuizMsController {
  constructor(private readonly quizMsService: QuizMsService) {}

  @Get()
  getHello(): string {
    return this.quizMsService.getHello();
  }
  @MessagePattern({ cmd: 'create_quiz' })
  createQuiz(@Payload() createQuizDTO: CreateQuizDto) {
    return this.quizMsService.createQuiz(createQuizDTO);
  }

  @MessagePattern({ cmd: 'get_all_quizzes' })
  getAllQuizzes() {
    return this.quizMsService.getAllQuizzes();
  }

  @MessagePattern({ cmd: 'get_quizzes_by_user' })
  getQuizzesByUserId(data: { userId: string }) {
    return this.quizMsService.getQuizzesByUserId(data.userId);
  }

  @MessagePattern({ cmd: 'get_quizzes_by_group' })
  getQuizByGroupId(@Payload() groupId: string) {
    return this.quizMsService.getQuizByGroupId(groupId);
  }

  @MessagePattern({ cmd: 'update_quiz' })
  updateQuiz(
    @Payload() data: { quizId: string; updateQuizDto: UpdateQuizDto },
  ) {
    return this.quizMsService.updateQuiz(data.quizId, data.updateQuizDto);
  }

  @MessagePattern({ cmd: 'delete_quiz' })
  deleteQuiz(@Payload() quizId: string) {
    return this.quizMsService.deleteQuiz(quizId);
  }

  @MessagePattern({ cmd: 'create_quiz_question' })
  createQuizQuestion(@Payload() createQuizQuestionDto: CreateQuizQuestionDto) {
    return this.quizMsService.createQuizQuestion(createQuizQuestionDto);
  }

  @MessagePattern({ cmd: 'get_quiz_questions' })
  getQuizQuestions(@Payload() quizId: string) {
    return this.quizMsService.getQuizQuestions(quizId);
  }

  @MessagePattern({ cmd: 'update_quiz_question' })
  updateQuizQuestion(@Payload() updateQuizQuestionDto: UpdateQuizQuestionDto) {
    const { quizId, question_no, ...updatedData } = updateQuizQuestionDto;
    return this.quizMsService.updateQuizQuestion(
      quizId,
      question_no,
      updatedData,
    );
  }

  @MessagePattern({ cmd: 'create_quiz_attempt' })
  createQuizAttempt(@Payload() createQuizAttemptDTO: CreateQuizAttemptDto) {
    return this.quizMsService.createQuizAttempt(createQuizAttemptDTO);
  }

  @MessagePattern({ cmd: 'get_quiz_attempts_by_quiz' })
  getQuizAttemptsByQuiz(@Payload() quizId: string) {
    return this.quizMsService.getQuizAttemptsByQuiz(quizId);
  }

  @MessagePattern({ cmd: 'get_user_attempted_quizzes' })
  getUserAttemptedQuizzes(@Payload() data: { userId: string }) {
    return this.quizMsService.getUserAttemptedQuizzes(data.userId);
  }

  @MessagePattern({"cmd": "delete_group_quizzes"})
  deleteGroupQuizzes(@Payload() data: { groupId: string }) {
    return this.quizMsService.deleteGroupQuizzes(data.groupId);
  }

  @MessagePattern({ cmd: 'get_quiz_by_id' })
  getQuizById(@Payload() quizId: string) {
    return this.quizMsService.getQuizById(quizId);
  }

}