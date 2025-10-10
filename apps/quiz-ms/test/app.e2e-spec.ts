import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizMsController } from './../src/quiz-ms.controller';
import { QuizMsService } from './../src/quiz-ms.service';
import { Quiz } from '../src/entity/quiz.entity';
import { QuizQuestion } from '../src/entity/quiz-question.entity';
import { QuizAttempt } from '../src/entity/quiz-attempt.entity';
import { QuestionType } from '../src/dto/create-quiz-question.dto';
import { of } from 'rxjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: process.cwd() + '/env/.common.env' });

describe('QuizMsController (e2e)', () => {
  let app: INestApplication;
  let quizService: QuizMsService;

  // Mock external services
  const mockAuthService = {
    send: jest.fn(),
  };

  const mockWorkspaceService = {
    send: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Use your existing PostgreSQL configuration
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [Quiz, QuizQuestion, QuizAttempt],
          synchronize: false, // Don't modify schema in tests
          ssl: {
            rejectUnauthorized: false,
          },
          logging: false,
        }),
        TypeOrmModule.forFeature([Quiz, QuizQuestion, QuizAttempt]),
      ],
      controllers: [QuizMsController],
      providers: [
        QuizMsService,
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

    app = moduleFixture.createNestApplication();
    await app.init();

    quizService = app.get<QuizMsService>(QuizMsService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Quiz Operations', () => {
    let createdQuizId: string;

    beforeEach(() => {
      // Reset mocks
      mockAuthService.send.mockClear();
      mockWorkspaceService.send.mockClear();
    });

    it('should create a quiz', async () => {
      const createQuizDto = {
        title: 'E2E Test Quiz',
        description: 'Test Description for E2E',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 60,
      };

      // Mock external service responses
      mockWorkspaceService.send.mockReturnValue(
        of({ groupId: createQuizDto.groupId }),
      );
      mockAuthService.send.mockReturnValue(
        of({ id: createQuizDto.createdById }),
      );

      const result = await quizService.createQuiz(createQuizDto);

      // Service returns entity directly on success
      expect(result).toBeDefined();
      expect((result as Quiz).title).toBe(createQuizDto.title);
      expect((result as Quiz).quizId).toBeDefined();
      createdQuizId = (result as Quiz).quizId;
    });

    it('should get all quizzes', async () => {
      const result = await quizService.getAllQuizzes();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should get quizzes by group ID', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';

      mockWorkspaceService.send.mockReturnValue(of({ groupId }));

      const result = await quizService.getQuizByGroupId(groupId);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should update a quiz', async () => {
      if (!createdQuizId) {
        throw new Error('No quiz created to update');
      }

      const updateData = {
        title: 'Updated E2E Test Quiz',
        description: 'Updated Description',
      };

      const result = await quizService.updateQuiz(createdQuizId, updateData);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data?.title).toBe(updateData.title);
    });

    it('should delete a quiz', async () => {
      if (!createdQuizId) {
        throw new Error('No quiz created to delete');
      }

      const result = await quizService.deleteQuiz(createdQuizId);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Quiz deleted successfully');
    });
  });

  describe('Quiz Question Operations', () => {
    let testQuizId: string;

    beforeAll(async () => {
      // Create a test quiz for question operations
      const createQuizDto = {
        title: 'Question Test Quiz',
        description: 'For testing questions',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 60,
      };

      mockWorkspaceService.send.mockReturnValue(
        of({ groupId: createQuizDto.groupId }),
      );
      mockAuthService.send.mockReturnValue(
        of({ id: createQuizDto.createdById }),
      );

      const quiz = await quizService.createQuiz(createQuizDto);
      testQuizId = (quiz as Quiz).quizId;
    });
    it('should create a quiz question', async () => {
      const questionDto = {
        quizId: testQuizId,
        question_no: 1,
        question_type: QuestionType.MCQ,
        question: 'What is 2+2?',
        correct_answer: 'A',
      };

      const result = await quizService.createQuizQuestion(questionDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data?.question).toBe(questionDto.question);
    });

    it('should get quiz questions', async () => {
      const result = await quizService.getQuizQuestions(testQuizId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should update a quiz question', async () => {
      const updateData = {
        question: 'What is 3+3?',
        correct_answer: 'B',
      };

      const result = await quizService.updateQuizQuestion(
        testQuizId,
        1,
        updateData,
      );
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data?.question).toBe(updateData.question);
    });
  });

  describe('Quiz Attempt Operations', () => {
    let testQuizId: string;

    beforeAll(async () => {
      // Create a test quiz for attempt operations
      const createQuizDto = {
        title: 'Attempt Test Quiz',
        description: 'For testing attempts',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: true,
        timeLimit: 60,
      };

      mockWorkspaceService.send.mockReturnValue(
        of({ groupId: createQuizDto.groupId }),
      );
      mockAuthService.send.mockReturnValue(
        of({ id: createQuizDto.createdById }),
      );

      const quiz = await quizService.createQuiz(createQuizDto);
      testQuizId = (quiz as Quiz).quizId;
    });

    it('should create a quiz attempt', async () => {
      const attemptDto = {
        quizId: testQuizId,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        attempt_no: 1,
        score: 85,
        time_taken: 45,
        submitted_at: new Date(),
        answers: [{ question_no: 1, answer: 'A' }],
      };

      mockAuthService.send.mockReturnValue(of({ id: attemptDto.userId }));

      const result = await quizService.createQuizAttempt(attemptDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data?.score).toBe(attemptDto.score);
    });

    it('should get quiz attempts by quiz', async () => {
      const result = await quizService.getQuizAttemptsByQuiz(testQuizId);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get user attempted quizzes', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174002';

      const result = await quizService.getUserAttemptedQuizzes(userId);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent quiz deletion', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const result = await quizService.deleteQuiz(nonExistentId);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Quiz not found');
    });

    it('should handle quiz creation with invalid group', async () => {
      const createQuizDto = {
        title: 'Invalid Group Quiz',
        description: 'Testing invalid group',
        groupId: 'invalid-group-id',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 60,
      };

      // Mock external service to return null (not found)
      mockWorkspaceService.send.mockReturnValue(of(null));
      const result = await quizService.createQuiz(createQuizDto);

      expect((result as any).success).toBe(false);
      expect((result as any).statusCode).toBe(404);
      expect((result as any).message).toBe('Group not found');
    });
  });
});
