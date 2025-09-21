import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { CreateQuizDto } from '../../../quiz-ms/src/dto/create-quiz.dto';
import { UpdateQuizDto } from '../../../quiz-ms/src/dto/update-quiz.dto';
import { handleValidationError } from '../utils/validationErrorHandler';
import { CreateQuizQuestionDto } from 'apps/quiz-ms/src/dto/create-quiz-question.dto';


@Controller('quiz')
export class QuizController {
  constructor(
    @Inject('QUIZ_SERVICE') private readonly quizClient: ClientProxy,
  ) {}

  @Post('create')
  async createQuiz(@Body() createQuizDto: CreateQuizDto, @Res() res: Response) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'create_quiz' }, createQuizDto),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    return res.json(response);
  }

  @Get()
  async getAllQuizzes(@Res() res: Response) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_all_quizzes' }, {}),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    return res.json(response);
  }

  @Get('user/:userId')
  async getQuizzesByUser(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_quizzes_by_user' }, { userId }),
    );

    return res.json(response);
  }

  @Get('group/:groupId')
  async getQuizzesByGroup(
    @Param('groupId') groupId: string,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_quizzes_by_group' }, { groupId }),
    );

    return res.json(response);
  }

  @Post('update/:quizId')
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'update_quiz' }, { quizId, updateQuizDto }),
    );

    return res.json(response);
  }

  @Post('delete/:quizId')
  async deleteQuiz(@Param('quizId') quizId: string, @Res() res: Response) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'delete_quiz' }, { quizId }),
    );

    return res.json(response);
  }

  @Post('question/create')
  async createQuizQuestion(@Body() createQuizQuestionDto: CreateQuizQuestionDto,@Res() res: Response) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'create_quiz_question' }, createQuizQuestionDto),
    );
    return res.json(response);
  }

  @Get('question/:quizId')
  async getQuizQuestions(@Param('quizId') quizId: string,@Res() res: Response) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_quiz_questions' }, quizId),
    );
    return res.json(response);
  }

  @Post('question/update')
  async updateQuizQuestion(@Body() updateQuizQuestionDto: UpdateQuizDto,@Res() res: Response) {
    const response = await lastValueFrom(
      this.quizClient.send({cmd:'update_quiz_question'}, updateQuizQuestionDto),
    );
    return res.json(response)
  }
}
