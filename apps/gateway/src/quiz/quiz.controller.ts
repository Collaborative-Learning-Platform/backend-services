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
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { handleValidationError } from '../utils/validationErrorHandler';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';

@Controller('quiz')
export class QuizController {
  constructor(
    @Inject('QUIZ_SERVICE') private readonly quizClient: ClientProxy,
    @Inject('WORKSPACE_SERVICE') private readonly workspaceClient: ClientProxy,
  ) {}

  //Quiz operations
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

  @Get('user-group/:userId')
  async getQuizzesByUserGroups(
    @Param('userId') userId: string,
    @Res() res: Response,
  ){
    const userGroupsResponse = await lastValueFrom(
      this.workspaceClient.send({ cmd: 'get_groups_by_user' }, {userId}),
    );
    // console.log('User Groups Response:', userGroupsResponse);
    if (!userGroupsResponse?.success || !userGroupsResponse?.data) {
      return res.json({
        success: false,
        message: 'Could not fetch user groups',
        data: { groups: [], quizzes: [] },
      });
    }
    const userGroups = userGroupsResponse.data;
   
    const quizPromises = userGroups.map(async (group) =>{
      try{
        const quizzes = await lastValueFrom(
          this.quizClient.send({ cmd: 'get_quizzes_by_group' }, group.groupId),
        );
        return {
          groupId: group.groupId,
          groupName: group.groupName,
          workspaceId: group.workspaceId,
          quizzes: quizzes?.success? quizzes.data || [] : [],
        };

      } catch (error){
        return {
          groupId: group.groupId,
          groupName: group.groupName,
          workspaceId: group.workspaceId,
          workspaceName: group.workspaceName,
          quizzes: [],
        };
      }
    })
    
    const quizResults = await Promise.all(quizPromises);
    console.log('Quiz Results:', quizResults);
    const userQuizzes = quizResults.flatMap((result) =>
      result.quizzes.map((quiz: any) => ({
        ...quiz,
        groupName: result.groupName,
        
      })),
    );
    return res.json({
      success: true,
      message: 'Successfully fetched quizzes from user groups',
      data: {
        userId,
        totalQuizzes: userQuizzes.length,
        quizzes: userQuizzes,
      },
    });
  }

  @Get('group/:groupId')
  async getQuizzesByGroup(
    @Param('groupId') groupId: string,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_quizzes_by_group' }, groupId),
    );

    return res.json(response);
  }

  @Get('/:quizId')
  async getQuizById(@Param('quizId') quizId: string, @Res() res: Response) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_quiz_by_id' }, quizId),
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

  //Quiz Question operations
  @Post('question/create')
  async createQuizQuestion(
    @Body() createQuizQuestionDto: CreateQuizQuestionDto,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send(
        { cmd: 'create_quiz_question' },
        createQuizQuestionDto,
      ),
    );
    return res.json(response);
  }

  @Get('question/:quizId')
  async getQuizQuestions(
    @Param('quizId') quizId: string,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_quiz_questions' }, quizId),
    );
    return res.json(response);
  }

  @Post('question/update')
  async updateQuizQuestion(
    @Body() updateQuizQuestionDto: UpdateQuizDto,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send(
        { cmd: 'update_quiz_question' },
        updateQuizQuestionDto,
      ),
    );
    return res.json(response);
  }
  //Quiz Attempt operations
  @Post('attempt/create')
  async createQuizAttempt(
    @Body() createQuizAttemptDto: CreateQuizAttemptDto,
    @Res() res: Response,
  ) {
    console.log(createQuizAttemptDto);
    const response = await lastValueFrom(
      this.quizClient.send(
        { cmd: 'create_quiz_attempt' },
        createQuizAttemptDto,
      ),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    return res.json(response);
  }

  @Get('attempt/:quizId')
  async getQuizAttemptsByQuiz(
    @Param('quizId') quizId: string,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.quizClient.send({ cmd: 'get_quiz_attempts_by_quiz' }, quizId),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }
    return res.json(response);
  }
}
