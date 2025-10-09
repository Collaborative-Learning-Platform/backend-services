import { Test, TestingModule } from '@nestjs/testing';
import { QuizMsController } from './quiz-ms.controller';
import { QuizMsService } from './quiz-ms.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';

describe('QuizMsController', () => {
  let controller: QuizMsController;
  let service: QuizMsService;

  const mockQuizService = {
    getHello: jest.fn(),
    createQuiz: jest.fn(),
    getAllQuizzes: jest.fn(),
    getQuizzesByUserId: jest.fn(),
    getQuizByGroupId: jest.fn(),
    updateQuiz: jest.fn(),
    deleteQuiz: jest.fn(),
    createQuizQuestion: jest.fn(),
    getQuizQuestions: jest.fn(),
    updateQuizQuestion: jest.fn(),
    createQuizAttempt: jest.fn(),
    getQuizAttemptsByQuiz: jest.fn(),
    getUserAttemptedQuizzes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizMsController],
      providers: [
        {
          provide: QuizMsService,
          useValue: mockQuizService,
        },
      ],
    }).compile();

    controller = module.get<QuizMsController>(QuizMsController);
    service = module.get<QuizMsService>(QuizMsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return hello message', () => {
      const result = 'Hello World!';
      mockQuizService.getHello.mockReturnValue(result);

      expect(controller.getHello()).toBe(result);
      expect(mockQuizService.getHello).toHaveBeenCalled();
    });
  });

  describe('createQuiz', () => {
    it('should create a quiz successfully', async () => {
      const createQuizDto: CreateQuizDto = {
        title: 'Test Quiz',
        description: 'Test Description',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 60,
      };

      const expectedResult = {
        success: true,
        statusCode: 201,
        message: 'Quiz created successfully',
        data: {
          quizId: '123e4567-e89b-12d3-a456-426614174002',
          ...createQuizDto,
        },
      };

      mockQuizService.createQuiz.mockResolvedValue(expectedResult);

      const result = await controller.createQuiz(createQuizDto);

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.createQuiz).toHaveBeenCalledWith(createQuizDto);
    });
  });

  describe('getAllQuizzes', () => {
    it('should return all quizzes', async () => {
      const expectedResult = {
        success: true,
        statusCode: 200,
        data: [
          {
            quizId: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Test Quiz 1',
            description: 'Description 1',
          },
          {
            quizId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Test Quiz 2',
            description: 'Description 2',
          },
        ],
      };

      mockQuizService.getAllQuizzes.mockResolvedValue(expectedResult);

      const result = await controller.getAllQuizzes();

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.getAllQuizzes).toHaveBeenCalled();
    });
  });

  describe('getQuizzesByUserId', () => {
    it('should return quizzes by user ID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        success: true,
        statusCode: 200,
        data: [
          {
            quizId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'User Quiz',
            createdById: userId,
          },
        ],
      };

      mockQuizService.getQuizzesByUserId.mockResolvedValue(expectedResult);

      const result = await controller.getQuizzesByUserId({ userId });

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.getQuizzesByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getQuizByGroupId', () => {
    it('should return quizzes by group ID', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        success: true,
        statusCode: 200,
        data: [
          {
            quizId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Group Quiz',
            groupId: groupId,
          },
        ],
      };

      mockQuizService.getQuizByGroupId.mockResolvedValue(expectedResult);

      const result = await controller.getQuizByGroupId(groupId);

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.getQuizByGroupId).toHaveBeenCalledWith(groupId);
    });
  });

  describe('updateQuiz', () => {
    it('should update a quiz successfully', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';
      const updateQuizDto: UpdateQuizDto = {
        title: 'Updated Quiz Title',
        description: 'Updated Description',
      };

      const expectedResult = {
        success: true,
        statusCode: 200,
        message: 'Quiz updated successfully',
        data: { quizId, ...updateQuizDto },
      };

      mockQuizService.updateQuiz.mockResolvedValue(expectedResult);

      const result = await controller.updateQuiz({ quizId, updateQuizDto });

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.updateQuiz).toHaveBeenCalledWith(
        quizId,
        updateQuizDto,
      );
    });
  });

  describe('deleteQuiz', () => {
    it('should delete a quiz successfully', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        success: true,
        statusCode: 200,
        message: 'Quiz deleted successfully',
      };

      mockQuizService.deleteQuiz.mockResolvedValue(expectedResult);

      const result = await controller.deleteQuiz(quizId);

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.deleteQuiz).toHaveBeenCalledWith(quizId);
    });
  });

  describe('createQuizQuestion', () => {
    it('should create a quiz question successfully', async () => {
      const createQuizQuestionDto: CreateQuizQuestionDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        question_no: 1,
        question_type: 'MULTIPLE_CHOICE' as any,
        question: 'What is 2+2?',
        correct_answer: 'A',
      };

      const expectedResult = {
        success: true,
        statusCode: 201,
        message: 'Question created successfully',
        data: createQuizQuestionDto,
      };

      mockQuizService.createQuizQuestion.mockResolvedValue(expectedResult);

      const result = await controller.createQuizQuestion(createQuizQuestionDto);

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.createQuizQuestion).toHaveBeenCalledWith(
        createQuizQuestionDto,
      );
    });
  });

  describe('getQuizQuestions', () => {
    it('should return quiz questions', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        success: true,
        statusCode: 200,
        data: [
          {
            question_no: 1,
            question_type: 'MULTIPLE_CHOICE',
            question: 'What is 2+2?',
            correct_answer: 'A',
          },
        ],
      };

      mockQuizService.getQuizQuestions.mockResolvedValue(expectedResult);

      const result = await controller.getQuizQuestions(quizId);

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.getQuizQuestions).toHaveBeenCalledWith(quizId);
    });
  });

  describe('updateQuizQuestion', () => {
    it('should update a quiz question successfully', async () => {
      const updateQuizQuestionDto: UpdateQuizQuestionDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        question_no: 1,
        question: 'Updated question?',
        correct_answer: 'B',
      };

      const expectedResult = {
        success: true,
        statusCode: 200,
        message: 'Question updated successfully',
        data: updateQuizQuestionDto,
      };

      mockQuizService.updateQuizQuestion.mockResolvedValue(expectedResult);

      const result = await controller.updateQuizQuestion(updateQuizQuestionDto);

      const { quizId, question_no, ...updatedData } = updateQuizQuestionDto;
      expect(result).toEqual(expectedResult);
      expect(mockQuizService.updateQuizQuestion).toHaveBeenCalledWith(
        quizId,
        question_no,
        updatedData,
      );
    });
  });

  describe('createQuizAttempt', () => {
    it('should create a quiz attempt successfully', async () => {
      const createQuizAttemptDto: CreateQuizAttemptDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        attempt_no: 1,
        score: 85,
        time_taken: 45,
        submitted_at: new Date(),
        answers: [{ question_no: 1, answer: 'A' }],
      };

      const expectedResult = {
        success: true,
        statusCode: 201,
        message: 'Quiz attempt recorded successfully',
        data: createQuizAttemptDto,
      };

      mockQuizService.createQuizAttempt.mockResolvedValue(expectedResult);

      const result = await controller.createQuizAttempt(createQuizAttemptDto);

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.createQuizAttempt).toHaveBeenCalledWith(
        createQuizAttemptDto,
      );
    });
  });

  describe('getQuizAttemptsByQuiz', () => {
    it('should return quiz attempts for a quiz', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        success: true,
        statusCode: 200,
        data: [
          {
            userId: '123e4567-e89b-12d3-a456-426614174001',
            score: 85,
            time_taken: 45,
            submitted_at: new Date(),
          },
        ],
      };

      mockQuizService.getQuizAttemptsByQuiz.mockResolvedValue(expectedResult);

      const result = await controller.getQuizAttemptsByQuiz(quizId);

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.getQuizAttemptsByQuiz).toHaveBeenCalledWith(
        quizId,
      );
    });
  });

  describe('getUserAttemptedQuizzes', () => {
    it('should return attempted quizzes for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedResult = {
        success: true,
        statusCode: 200,
        data: [
          {
            quizId: '123e4567-e89b-12d3-a456-426614174001',
            score: 85,
            time_taken: 45,
            submitted_at: new Date(),
          },
        ],
      };

      mockQuizService.getUserAttemptedQuizzes.mockResolvedValue(expectedResult);

      const result = await controller.getUserAttemptedQuizzes({ userId });

      expect(result).toEqual(expectedResult);
      expect(mockQuizService.getUserAttemptedQuizzes).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
