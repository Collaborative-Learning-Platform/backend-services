import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QuizMsService } from './quiz-ms.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Controller()
export class QuizMsController {
  constructor(private readonly quizMsService: QuizMsService) {}

  @MessagePattern({ cmd: 'create_quiz' })
  createQuiz(@Payload() createQuizDTO: CreateQuizDto) {
    return this.quizMsService.createQuiz(createQuizDTO);
  }

  @MessagePattern({ cmd: 'get_all_quizzes' })
  getAllQuizzes() {
    return this.quizMsService.getAllQuizzes();
  }

  @MessagePattern({ cmd: 'get_quizzes_by_user' })
  getQuizzesByUserId(@Payload() userId: string) {
    return this.quizMsService.getQuizzesByUserId(userId);
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
}
