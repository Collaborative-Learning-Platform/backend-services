import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizMsService } from '../src/quiz-ms.service';
import { QuizMsController } from '../src/quiz-ms.controller';
import { Quiz } from '../src/entity/quiz.entity';
import { QuizQuestion } from '../src/entity/quiz-question.entity';
import { QuizAttempt } from '../src/entity/quiz-attempt.entity';
import { QuestionType } from '../src/dto/create-quiz-question.dto';
import { of } from 'rxjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: process.cwd() + '/env/.common.env' });

describe('Quiz Microservice Simple Integration Tests', () => {
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
  }, 30000); // 30 second timeout for setup

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockAuthService.send.mockClear();
    mockWorkspaceService.send.mockClear();
  });

  describe('Basic Service Connectivity', () => {
    it('should connect to database and service', async () => {
      expect(app).toBeDefined();
      expect(quizService).toBeDefined();

      // Test the hello endpoint
      const hello = quizService.getHello();
      expect(hello).toBe('Hello World!');
    });

    it('should connect to PostgreSQL database', async () => {
      // Test database connectivity by trying to get all quizzes
      const result = await quizService.getAllQuizzes();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Quiz CRUD Operations', () => {
    let testQuizId: string;

    it('should create a new quiz', async () => {
      const createQuizDto = {
        title: 'Integration Test Quiz',
        description: 'A test quiz for integration testing',
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

      expect(result).toBeDefined();
      expect((result as Quiz).title).toBe(createQuizDto.title);
      expect((result as Quiz).quizId).toBeDefined();

      testQuizId = (result as Quiz).quizId;
    });
    it('should retrieve the created quiz', async () => {
      expect(testQuizId).toBeDefined();

      const allQuizzes = await quizService.getAllQuizzes();
      expect(Array.isArray(allQuizzes)).toBe(true);

      const createdQuiz = allQuizzes.find(
        (quiz: Quiz) => quiz.quizId === testQuizId,
      );
      expect(createdQuiz).toBeDefined();
      expect(createdQuiz?.title).toBe('Integration Test Quiz');
    });

    it('should update the quiz', async () => {
      expect(testQuizId).toBeDefined();

      const updateData = {
        title: 'Updated Integration Test Quiz',
        description: 'Updated description for testing',
      };

      const result = await quizService.updateQuiz(testQuizId, updateData);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe(updateData.title);
    });

    it('should delete the quiz', async () => {
      expect(testQuizId).toBeDefined();

      const result = await quizService.deleteQuiz(testQuizId);
      expect(result.success).toBe(true);
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
      expect((result as any).success).toBe(true);
      expect((result as any).data?.question).toBe(questionDto.question);
    });

    it('should retrieve quiz questions', async () => {
      const result = await quizService.getQuizQuestions(testQuizId);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
      // Clean up the test quiz
      if (testQuizId) {
        await quizService.deleteQuiz(testQuizId);
      }
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
      expect(result.data?.score).toBe(attemptDto.score);
    });

    it('should retrieve quiz attempts', async () => {
      const result = await quizService.getQuizAttemptsByQuiz(testQuizId);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    afterAll(async () => {
      // Clean up the test quiz
      if (testQuizId) {
        await quizService.deleteQuiz(testQuizId);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent quiz operations', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const result = await quizService.deleteQuiz(nonExistentId);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it('should handle invalid group validation', async () => {
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
      mockAuthService.send.mockReturnValue(
        of({ id: createQuizDto.createdById }),
      );

      const result = await quizService.createQuiz(createQuizDto);
      expect((result as any).success).toBe(false);
      expect((result as any).statusCode).toBe(404);
    });
  });
});
