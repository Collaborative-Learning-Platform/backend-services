import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entity/quiz.entity';
import { QuizAttempt } from './entity/quiz-attempt.entity';
import { QuizQuestion } from './entity/quiz-question.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class QuizMsService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,

    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepo: Repository<QuizAttempt>,

    @InjectRepository(QuizQuestion)
    private readonly quizQuestionRepo: Repository<QuizQuestion>,

    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,

    @Inject('WORKSPACE_SERVICE') private readonly workspaceService: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  //Quiz related services
  async createQuiz(createQuizDTO: CreateQuizDto) {
    const group = await lastValueFrom(
      this.workspaceService.send(
        { cmd: 'get_group_details' },
        { groupId: createQuizDTO.groupId },
      ),
    );
    if (!group) {
      return {
        success: false,
        statusCode: 404,
        message: 'Group not found',
      };
    }

    const user = await lastValueFrom(
      this.authService.send(
        { cmd: 'get_user_by_id' },
        createQuizDTO.createdById,
      ),
    );
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: 'User not found',
      };
    }

    const quiz = this.quizRepo.create({
      title: createQuizDTO.title,
      description: createQuizDTO.description,
      deadline: createQuizDTO.deadline,
      timeLimit: createQuizDTO.timeLimit,
      isPublished: createQuizDTO.isPublished ?? false,
      groupId: group.groupId,
      createdById: user.id,
    });

    try {
      return await this.quizRepo.save(quiz);
    } catch (error) {
      throw new BadRequestException('Error creating quiz: ' + error.message);
    }
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    try {
      return this.quizRepo.find({
        // relations: ['group', 'createdBy'],
        order: { deadline: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('Error fetching quizzes: ' + error.message);
    }
  }

  async getQuizzesByUserId(userId: string) {
    try {
      const user = await lastValueFrom(
        this.authService.send({ cmd: 'auth_get_user' }, { userId }),
      );
      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: 'User not found',
        };
      }

      const quizzes = await this.quizRepo
        .createQueryBuilder('quiz')
        .innerJoin('group', 'g', 'quiz."groupId" = g."groupId"')
        .innerJoin('workspace', 'w', 'g."workspaceId" = w."workspaceId"')
        .where('quiz."createdById" = :userId', { userId })
        .select([
          'quiz."quizId"',
          'quiz."title"',
          'quiz."description"',
          'quiz."deadline"',
          'quiz."isPublished"',
          'g."groupId"',
          'w."name" AS "workspaceName"', // fetch workspace name
        ])
        .getRawMany();

      return {
        success: true,
        statusCode: 200,
        data: quizzes,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 400,
        message: 'Error fetching quizzes: ' + error.message,
      };
    }
  }

  async getQuizByGroupId(groupId: string) {
    try {
      const group = await lastValueFrom(
        this.workspaceService.send({ cmd: 'get_group_details' }, groupId),
      );
      // console.log(group);
      if (!group) {
        return {
          success: false,
          statusCode: 404,
          message: 'Group not found',
        };
      }
      const groupQuizzes = await this.quizRepo.find({
        where: { groupId: groupId },
      });
      // console.log(groupQuizzes);
      return {
        success: true,
        statusCode: 200,
        data: groupQuizzes,
      };
    } catch (error) {
      throw new BadRequestException('Error fetching quizzes: ' + error.message);
    }
  }

  async updateQuiz(quizId: string, updateData: UpdateQuizDto) {
    try {
      const quiz = await this.quizRepo.findOne({ where: { quizId: quizId } });
      if (!quiz) {
        return {
          success: false,
          statusCode: 404,
          message: 'Quiz not found',
        };
      }

      const updatedQuiz = Object.assign(quiz, updateData);
      await this.quizRepo.save(updatedQuiz);
      return {
        success: true,
        statusCode: 200,
        data: updatedQuiz,
      };
    } catch (error) {
      throw new BadRequestException('Error updating quiz: ' + error.message);
    }
  }

  async deleteQuiz(quizId: string) {
    try {
      const quiz = await this.quizRepo.findOne({ where: { quizId: quizId } });
      if (!quiz) {
        return {
          success: false,
          statusCode: 404,
          message: 'Quiz not found',
        };
      } else {
        await this.quizRepo.remove(quiz);
        return {
          success: true,
          statusCode: 200,
          message: 'Quiz deleted successfully',
        };
      }
    } catch (error) {
      throw new BadRequestException('Error deleting quiz: ' + error.message);
    }
  }

  //Quiz Question related services
  async createQuizQuestion(createQuizQuestionDTo: CreateQuizQuestionDto) {
    try {
      const quiz = await this.quizRepo.findOne({
        where: { quizId: createQuizQuestionDTo.quizId },
      });
      if (!quiz) {
        return {
          success: false,
          statusCode: 404,
          message: 'Quiz not found',
        };
      } else {
        const newQuestion = this.quizQuestionRepo.create({
          question_no: createQuizQuestionDTo.question_no,
          quizId: createQuizQuestionDTo.quizId,
          question_type: createQuizQuestionDTo.question_type,
          question: createQuizQuestionDTo.question,
          correct_answer: createQuizQuestionDTo.correct_answer,
        });
        await this.quizQuestionRepo.save(newQuestion);
        return {
          success: true,
          statusCode: 201,
          data: newQuestion,
        };
      }
    } catch (error) {
      throw new BadRequestException(
        'Error creating quiz question: ' + error.message,
      );
    }
  }

  async getQuizQuestions(quizId: string) {
    try {
      const quiz = await this.quizRepo.findOne({ where: { quizId: quizId } });
      if (!quiz) {
        return {
          success: false,
          statusCode: 404,
          message: 'Quiz not found',
        };
      } else {
        const questions = await this.quizQuestionRepo.find({
          where: { quizId: quizId },
        });
        return {
          success: true,
          statusCode: 200,
          data: questions,
        };
      }
    } catch (error) {
      throw new BadRequestException(
        'Error fetching quiz questions: ' + error.message,
      );
    }
  }

  async updateQuizQuestion(
    quizId: string,
    question_no: number,
    updateData: Partial<Omit<QuizQuestion, 'quizId' | 'question_no'>>,
  ) {
    try {
      const question = await this.quizQuestionRepo.findOne({
        where: { quizId, question_no },
        relations: ['quiz'],
      });

      if (!question) {
        return {
          success: false,
          statusCode: 404,
          message: 'Question not found for the given quiz',
        };
      }

      Object.assign(question, updateData);
      await this.quizQuestionRepo.save(question);

      return {
        success: true,
        statusCode: 200,
        message: 'Question updated successfully',
        data: question,
      };
    } catch (error) {
      throw new BadRequestException(
        'Error updating quiz question: ' + error.message,
      );
    }
  }

  //Quiz Attempt related services
  async createQuizAttempt(createQuizAttemptDTO: CreateQuizAttemptDto) {
    try {
      const quiz = await this.quizRepo.findOne({
        where: { quizId: createQuizAttemptDTO.quizId },
      });
      if (!quiz) {
        return {
          success: false,
          statusCode: 404,
          message: 'Quiz not found',
        };
      }

      const user = await lastValueFrom(
        this.authService.send(
          { cmd: 'auth_get_user' },
          { userId: createQuizAttemptDTO.userId },
        ),
      );
      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: 'User not found',
        };
      }
      const newAttempt = this.quizAttemptRepo.create({
        quizId: createQuizAttemptDTO.quizId,
        userId: createQuizAttemptDTO.userId,
        attempt_no: createQuizAttemptDTO.attempt_no,
        answers: createQuizAttemptDTO.answers,
        score: createQuizAttemptDTO.score,
        time_taken: createQuizAttemptDTO.time_taken,
        submitted_at: createQuizAttemptDTO.submitted_at,
      });
      await this.quizAttemptRepo.save(newAttempt);
      return {
        success: true,
        statusCode: 201,
        data: newAttempt,
      };
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          statusCode: 503,
          message: 'Service temporarily unavailable. Please try again later.',
        };
      }
      return {
        success: false,
        statusCode: 400,
        message: 'Error creating quiz attempt: ' + error.message,
      };
    }
  }

  async getQuizAttemptsByQuiz(quizId: string) {
    try {
      const quiz = await this.quizRepo.findOne({ where: { quizId: quizId } });
      if (!quiz) {
        return {
          success: false,
          statusCode: 404,
          message: 'Quiz not found',
        };
      }
      const quizAttempts = await this.quizAttemptRepo.find({
        where: { quizId: quizId },
      });
      return {
        success: true,
        statusCode: 200,
        data: quizAttempts,
      };
    } catch (error) {
      throw new BadRequestException(
        'Error fetching quiz attempts: ' + error.message,
      );
    }
  }
  async getUserAttemptedQuizzes(userId: string) {
    try {
      const attempts = await this.quizAttemptRepo.find({
        where: { userId: userId },
        relations: ['quiz'],
      });
      if (attempts.length === 0) {
        return {
          success: true,
          statusCode: 200,
          data: [],
          message: 'No quiz attempts found for the user',
        };
      } else {
        return {
          success: true,
          statusCode: 200,
          data: attempts,
        };
      }
    
    }catch (error) {
      return {
        success: false,
        statusCode: 400,
        message: 'Error fetching user attempted quizzes: ' + error.message,
      };
    }
  }

}
