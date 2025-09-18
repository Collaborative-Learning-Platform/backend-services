import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entity/quiz.entity';
import { QuizAttempt } from './entity/quiz-attempt.entity';
import { QuizQuestion } from './entity/quiz-question.entity';
import { User } from '../../user-ms/src/entity/user.entity';
import { Group } from '../../workspace-ms/src/entity/group.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { stat } from 'fs';

@Injectable()
export class QuizMsService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,

    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepo: Repository<QuizAttempt>,

    @InjectRepository(QuizQuestion)
    private readonly quizQuestionRepo: Repository<QuizQuestion>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createQuiz(createQuizDTO: CreateQuizDto) {
    const group = await this.groupRepo.findOne({
      where: { groupId: createQuizDTO.groupId },
    });
    if (!group) {
      return {
        success: false,
        statusCode: 404,
        message: 'Group not found',
      };
    }

    const user = await this.userRepo.findOne({
      where: { id: createQuizDTO.createdById },
    });
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
    return this.quizRepo.find({
      // relations: ['group', 'createdBy'],
      order: { deadline: 'ASC' },
    });
  }

  async getQuizzesByUserId(userId: string) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return {
          success: false,
          statusCode: 404,
          message: 'User not found',
        };
      } else {
        const userQuizzes = await this.quizRepo.find({
          where: { createdById: userId },
        });
        return {
          success: true,
          statusCode: 200,
          data: userQuizzes,
        };
      }
    } catch (error) {
      throw new BadRequestException('Error fetching quizzes: ' + error.message);
    }
  }

  async getQuizByGroupId(groupId: string) {
    try {
      const group = await this.groupRepo.findOne({
        where: { groupId: groupId },
      });
      if (!group) {
        return {
          success: false,
          statusCode: 404,
          message: 'Group not found',
        };
      } else {
        const groupQuizzes = await this.quizRepo.find({
          where: { groupId: groupId },
        });

        return {
          success: true,
          statusCode: 200,
          data: groupQuizzes,
        };
      }
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
      const quiz= await this.quizRepo.findOne({ where: { quizId: quizId } });
      if (!quiz){
        return{
          success:false,
          statusCode:404,
          message:'Quiz not found'
        }
      }else {
        await this.quizRepo.remove(quiz);
        return{
          success:true,
          statusCode:200,
          message:'Quiz deleted successfully'
        }
      }
    } catch (error){
      throw new BadRequestException('Error deleting quiz: ' + error.message);
    }
  }
}
