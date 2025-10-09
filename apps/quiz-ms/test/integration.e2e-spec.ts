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

describe('Quiz Microservice Integration Tests', () => {
  let app: INestApplication;
  let quizService: QuizMsService;
  let quizId: string;

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

  // Add a simple connectivity test first
  describe('Database and Service Connectivity', () => {
    it('should connect to database and service', async () => {
      expect(app).toBeDefined();
      expect(quizService).toBeDefined();

      // Test the hello endpoint
      const hello = quizService.getHello();
      expect(hello).toBe('Hello World!');
    });
  });

  describe('Complete Quiz Workflow', () => {
    it('should create a complete quiz with questions and handle attempts', async () => {
      // Step 1: Create Quiz
      const createQuizDto = {
        title: 'Integration Test Quiz',
        description: 'Complete workflow test',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: true,
        timeLimit: 120,
      };

      mockWorkspaceService.send.mockReturnValue(
        of({ groupId: createQuizDto.groupId }),
      );
      mockAuthService.send.mockReturnValue(
        of({ id: createQuizDto.createdById }),
      );

      const quizResult = await quizService.createQuiz(createQuizDto);
      expect((quizResult as Quiz).title).toBe(createQuizDto.title);
      quizId = (quizResult as Quiz).quizId;

      // Step 2: Add Questions
      const questions = [
        {
          quizId,
          question_no: 1,
          question_type: QuestionType.MCQ,
          question: 'What is 2+2?',
          correct_answer: 'A',
        },
        {
          quizId,
          question_no: 2,
          question_type: QuestionType.MCQ,
          question: 'What is 3+3?',
          correct_answer: 'B',
        },
      ];
      const questionResults: any[] = [];
      for (const question of questions) {
        const questionResult = await quizService.createQuizQuestion(question);
        expect((questionResult as any).success).toBe(true);
        questionResults.push(questionResult);
      }

      // Step 3: Create Quiz Attempts
      const attemptDto = {
        quizId,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        attempt_no: 1,
        score: 90,
        time_taken: 45,
        submitted_at: new Date(),
        answers: [
          { question_no: 1, answer: 'A' },
          { question_no: 2, answer: 'B' },
        ],
      };

      mockAuthService.send.mockReturnValue(of({ id: attemptDto.userId }));

      const attemptResult = await quizService.createQuizAttempt(attemptDto);
      expect(attemptResult.success).toBe(true);
      expect(attemptResult.data?.score).toBe(90);

      // Step 4: Verify retrieval operations
      const allQuizzes = await quizService.getAllQuizzes();
      expect(Array.isArray(allQuizzes)).toBe(true);
      expect(allQuizzes.length).toBeGreaterThan(0);

      const quizQuestions = await quizService.getQuizQuestions(quizId);
      expect(quizQuestions.success).toBe(true);
      expect(quizQuestions.data?.length).toBe(2);

      const quizAttempts = await quizService.getQuizAttemptsByQuiz(quizId);
      expect(quizAttempts.success).toBe(true);
      expect(Array.isArray(quizAttempts.data)).toBe(true);
    }, 15000); // 15 second timeout

    it('should handle question updates', async () => {
      if (!quizId) {
        throw new Error('Quiz not created');
      }

      // Update a question
      const updateData = {
        question: 'What is 4+4?',
        correct_answer: 'C',
      };

      const updateResult = await quizService.updateQuizQuestion(
        quizId,
        1,
        updateData,
      );
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.question).toBe(updateData.question);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent quiz attempts', async () => {
      // Create a quiz for concurrent testing
      const createQuizDto = {
        title: 'Concurrent Test Quiz',
        description: 'For testing concurrent access',
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

      const concurrentQuiz = await quizService.createQuiz(createQuizDto);
      const concurrentQuizId = (concurrentQuiz as Quiz).quizId; // Simulate concurrent attempts
      const attempts: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const attemptDto = {
          quizId: concurrentQuizId,
          userId: `user-${i}`,
          attempt_no: 1,
          score: 80 + i,
          time_taken: 30 + i,
          submitted_at: new Date(),
          answers: [{ question_no: 1, answer: 'A' }],
        };

        mockAuthService.send.mockReturnValue(of({ id: attemptDto.userId }));
        attempts.push(quizService.createQuizAttempt(attemptDto));
      }

      const results = await Promise.all(attempts);
      results.forEach((result: any) => {
        expect(result.success).toBe(true);
      });
    });

    it('should validate quiz constraints', async () => {
      // Test creating quiz with past deadline
      const pastDeadlineQuiz = {
        title: 'Past Deadline Quiz',
        description: 'Should still be created but noted',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2020-01-01'), // Past date
        isPublished: false,
        timeLimit: 60,
      };

      mockWorkspaceService.send.mockReturnValue(
        of({ groupId: pastDeadlineQuiz.groupId }),
      );
      mockAuthService.send.mockReturnValue(
        of({ id: pastDeadlineQuiz.createdById }),
      );

      const pastDeadlineResult = await quizService.createQuiz(pastDeadlineQuiz);
      expect(pastDeadlineResult).toBeDefined();
      // Quiz should still be created, deadline validation is business logic
    });

    it('should handle large quiz data', async () => {
      // Create a quiz with many questions
      const largeQuizDto = {
        title: 'Large Quiz Test',
        description: 'Testing with many questions',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 180,
      };

      mockWorkspaceService.send.mockReturnValue(
        of({ groupId: largeQuizDto.groupId }),
      );
      mockAuthService.send.mockReturnValue(
        of({ id: largeQuizDto.createdById }),
      );

      const largeQuiz = await quizService.createQuiz(largeQuizDto);
      const largeQuizId = (largeQuiz as Quiz).quizId; // Add 10 questions (reduced from 50 for test performance)
      const questionPromises: any[] = [];
      for (let i = 1; i <= 10; i++) {
        const questionDto = {
          quizId: largeQuizId,
          question_no: i,
          question_type: QuestionType.MCQ,
          question: `Question ${i}: What is ${i} + ${i}?`,
          correct_answer: 'A',
        };
        questionPromises.push(quizService.createQuizQuestion(questionDto));
      }

      const questionResults = await Promise.all(questionPromises);
      questionResults.forEach((result: any) => {
        expect(result.success).toBe(true);
      });

      // Verify all questions were created
      const allQuestions = await quizService.getQuizQuestions(largeQuizId);
      expect(allQuestions.success).toBe(true);
      expect(allQuestions.data?.length).toBe(10);
    }, 20000); // 20 second timeout for large data test
  });
});
