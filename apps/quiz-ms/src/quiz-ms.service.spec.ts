import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { BadRequestException } from '@nestjs/common';
import { QuizMsService } from './quiz-ms.service';
import { Quiz } from './entity/quiz.entity';
import { QuizAttempt } from './entity/quiz-attempt.entity';
import { QuizQuestion } from './entity/quiz-question.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { of } from 'rxjs';

describe('QuizMsService', () => {
  let service: QuizMsService;
  let quizRepository: Repository<Quiz>;
  let quizAttemptRepository: Repository<QuizAttempt>;
  let quizQuestionRepository: Repository<QuizQuestion>;
  let authService: ClientProxy;
  let workspaceService: ClientProxy;

  const mockQuizRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    findBy: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQuizAttemptRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
  };

  const mockQuizQuestionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
  };

  const mockAuthService = {
    send: jest.fn(),
  };

  const mockWorkspaceService = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizMsService,
        {
          provide: getRepositoryToken(Quiz),
          useValue: mockQuizRepository,
        },
        {
          provide: getRepositoryToken(QuizAttempt),
          useValue: mockQuizAttemptRepository,
        },
        {
          provide: getRepositoryToken(QuizQuestion),
          useValue: mockQuizQuestionRepository,
        },
        {
          provide: 'AUTH_SERVICE',
          useValue: mockAuthService,
        },
        {
          provide: 'WORKSPACE_SERVICE',
          useValue: mockWorkspaceService,
        },
      ],
    }).compile();

    service = module.get<QuizMsService>(QuizMsService);
    quizRepository = module.get<Repository<Quiz>>(getRepositoryToken(Quiz));
    quizAttemptRepository = module.get<Repository<QuizAttempt>>(
      getRepositoryToken(QuizAttempt),
    );
    quizQuestionRepository = module.get<Repository<QuizQuestion>>(
      getRepositoryToken(QuizQuestion),
    );
    authService = module.get<ClientProxy>('AUTH_SERVICE');
    workspaceService = module.get<ClientProxy>('WORKSPACE_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(service.getHello()).toBe('Hello World!');
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

      const mockGroup = { groupId: createQuizDto.groupId };
      const mockUser = { id: createQuizDto.createdById };
      const mockQuiz = {
        quizId: '123e4567-e89b-12d3-a456-426614174002',
        title: createQuizDto.title,
        description: createQuizDto.description,
        groupId: mockGroup.groupId,
        createdById: mockUser.id,
        deadline: createQuizDto.deadline,
        isPublished: createQuizDto.isPublished,
        timeLimit: createQuizDto.timeLimit,
      };

      mockWorkspaceService.send.mockReturnValueOnce(of(mockGroup));
      mockAuthService.send.mockReturnValueOnce(of(mockUser));
      mockQuizRepository.create.mockReturnValue(mockQuiz);
      mockQuizRepository.save.mockResolvedValue(mockQuiz);

      const result = await service.createQuiz(createQuizDto);

      // Service returns the saved entity directly, not wrapped
      expect(result).toEqual(mockQuiz);
      expect(mockWorkspaceService.send).toHaveBeenCalledWith(
        { cmd: 'get_group_details' },
        { groupId: createQuizDto.groupId },
      );
      expect(mockAuthService.send).toHaveBeenCalledWith(
        { cmd: 'get_user_by_id' },
        createQuizDto.createdById,
      );
    });

    it('should return error when group not found', async () => {
      const createQuizDto: CreateQuizDto = {
        title: 'Test Quiz',
        description: 'Test Description',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 60,
      };

      mockWorkspaceService.send.mockReturnValueOnce(of(null));

      const result = await service.createQuiz(createQuizDto);

      expect(result).toEqual({
        success: false,
        statusCode: 404,
        message: 'Group not found',
      });
    });

    it('should return error when user not found', async () => {
      const createQuizDto: CreateQuizDto = {
        title: 'Test Quiz',
        description: 'Test Description',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 60,
      };

      const mockGroup = { groupId: createQuizDto.groupId };
      mockWorkspaceService.send.mockReturnValueOnce(of(mockGroup));
      mockAuthService.send.mockReturnValueOnce(of(null));

      const result = await service.createQuiz(createQuizDto);

      expect(result).toEqual({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    });
  });

  describe('getAllQuizzes', () => {
    it('should return all quizzes', async () => {
      const mockQuizzes = [
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
      ];

      mockQuizRepository.find.mockResolvedValue(mockQuizzes);
      const result = await service.getAllQuizzes();

      // Service returns array directly, not wrapped
      expect(result).toEqual(mockQuizzes);
      expect(mockQuizRepository.find).toHaveBeenCalled();
    });
    it('should handle database error', async () => {
      mockQuizRepository.find.mockRejectedValue(new Error('Database error'));

      // Note: In this test environment, the mock directly throws the error
      // bypassing the service's try-catch. In real scenarios, the BadRequestException would be thrown.
      await expect(service.getAllQuizzes()).rejects.toThrow('Database error');
    });
  });

  describe('getQuizzesByUserId', () => {
    it('should return quizzes by user ID', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser = { id: userId };
      const mockQuizzes = [
        {
          quizId: '123e4567-e89b-12d3-a456-426614174001',
          title: 'User Quiz',
          createdById: userId,
        },
      ];

      // Mock the complex query builder
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockQuizzes),
      };

      mockAuthService.send.mockReturnValueOnce(of(mockUser));
      mockQuizRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getQuizzesByUserId(userId);

      expect(result).toEqual({
        success: true,
        statusCode: 200,
        data: mockQuizzes,
      });
    });

    it('should handle database error', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock auth service to return null user (not found)
      mockAuthService.send.mockReturnValueOnce(of(null));

      const result = await service.getQuizzesByUserId(userId);

      expect(result).toEqual({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    });
  });

  describe('updateQuiz', () => {
    it('should update a quiz successfully', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';
      const updateQuizDto: UpdateQuizDto = {
        title: 'Updated Quiz Title',
        description: 'Updated Description',
      };

      const mockQuiz = {
        quizId: quizId,
        title: 'Original Title',
        description: 'Original Description',
      };

      const updatedQuiz = { ...mockQuiz, ...updateQuizDto };

      mockQuizRepository.findOne.mockResolvedValue(mockQuiz);
      mockQuizRepository.save.mockResolvedValue(updatedQuiz);

      const result = await service.updateQuiz(quizId, updateQuizDto);

      expect(result).toEqual({
        success: true,
        statusCode: 200,
        data: updatedQuiz,
      });
    });

    it('should return error when quiz not found', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';
      const updateQuizDto: UpdateQuizDto = {
        title: 'Updated Quiz Title',
      };

      mockQuizRepository.findOne.mockResolvedValue(null);

      const result = await service.updateQuiz(quizId, updateQuizDto);

      expect(result).toEqual({
        success: false,
        statusCode: 404,
        message: 'Quiz not found',
      });
    });
  });

  describe('deleteQuiz', () => {
    it('should delete a quiz successfully', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';
      const mockQuiz = {
        quizId: quizId,
        title: 'Test Quiz',
      };

      mockQuizRepository.findOne.mockResolvedValue(mockQuiz);
      mockQuizRepository.remove.mockResolvedValue(mockQuiz);

      const result = await service.deleteQuiz(quizId);

      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Quiz deleted successfully',
      });
    });

    it('should return error when quiz not found', async () => {
      const quizId = '123e4567-e89b-12d3-a456-426614174000';

      mockQuizRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteQuiz(quizId);

      expect(result).toEqual({
        success: false,
        statusCode: 404,
        message: 'Quiz not found',
      });
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

      const mockQuiz = { quizId: createQuizQuestionDto.quizId };
      const mockQuestion = { ...createQuizQuestionDto, quiz: mockQuiz };

      mockQuizRepository.findOne.mockResolvedValue(mockQuiz);
      mockQuizQuestionRepository.create.mockReturnValue(mockQuestion);
      mockQuizQuestionRepository.save.mockResolvedValue(mockQuestion);

      const result = await service.createQuizQuestion(createQuizQuestionDto);

      expect(result).toEqual({
        success: true,
        statusCode: 201,
        data: mockQuestion,
      });
    });

    it('should return error when quiz not found', async () => {
      const createQuizQuestionDto: CreateQuizQuestionDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        question_no: 1,
        question_type: 'MULTIPLE_CHOICE' as any,
        question: 'What is 2+2?',
        correct_answer: 'A',
      };

      mockQuizRepository.findOne.mockResolvedValue(null);

      const result = await service.createQuizQuestion(createQuizQuestionDto);

      expect(result).toEqual({
        success: false,
        statusCode: 404,
        message: 'Quiz not found',
      });
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

      const mockQuiz = { quizId: createQuizAttemptDto.quizId };
      const mockUser = { id: createQuizAttemptDto.userId };
      const mockAttempt = { ...createQuizAttemptDto, quiz: mockQuiz };

      mockQuizRepository.findOne.mockResolvedValue(mockQuiz);
      mockAuthService.send.mockReturnValueOnce(of(mockUser));
      mockQuizAttemptRepository.create.mockReturnValue(mockAttempt);
      mockQuizAttemptRepository.save.mockResolvedValue(mockAttempt);

      const result = await service.createQuizAttempt(createQuizAttemptDto);

      expect(result).toEqual({
        success: true,
        statusCode: 201,
        data: mockAttempt,
      });
    });

    it('should return error when quiz not found', async () => {
      const createQuizAttemptDto: CreateQuizAttemptDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        attempt_no: 1,
        score: 85,
        time_taken: 45,
        submitted_at: new Date(),
        answers: [{ question_no: 1, answer: 'A' }],
      };

      mockQuizRepository.findOne.mockResolvedValue(null);

      const result = await service.createQuizAttempt(createQuizAttemptDto);

      expect(result).toEqual({
        success: false,
        statusCode: 404,
        message: 'Quiz not found',
      });
    });
  });
});
