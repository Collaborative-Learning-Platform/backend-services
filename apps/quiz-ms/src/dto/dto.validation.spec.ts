import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { UpdateQuizDto } from '../dto/update-quiz.dto';
import { CreateQuizQuestionDto } from '../dto/create-quiz-question.dto';
import { CreateQuizAttemptDto } from '../dto/create-quiz-attempt.dto';

describe('Quiz DTOs Validation', () => {
  describe('CreateQuizDto', () => {
    it('should validate a valid DTO', async () => {
      const validDto = {
        title: 'Test Quiz',
        description: 'Test Description',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        isPublished: false,
        timeLimit: 60,
      };

      const dto = plainToClass(CreateQuizDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when title is empty', async () => {
      const invalidDto = {
        title: '',
        description: 'Test Description',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        timeLimit: 60,
      };

      const dto = plainToClass(CreateQuizDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('title');
    });

    it('should fail validation when groupId is not UUID', async () => {
      const invalidDto = {
        title: 'Test Quiz',
        description: 'Test Description',
        groupId: 'invalid-uuid',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        timeLimit: 60,
      };

      const dto = plainToClass(CreateQuizDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const groupIdError = errors.find((error) => error.property === 'groupId');
      expect(groupIdError).toBeDefined();
    });

    it('should fail validation when timeLimit is negative', async () => {
      const invalidDto = {
        title: 'Test Quiz',
        description: 'Test Description',
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174001',
        deadline: new Date('2025-12-31'),
        timeLimit: -10,
      };

      const dto = plainToClass(CreateQuizDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const timeLimitError = errors.find(
        (error) => error.property === 'timeLimit',
      );
      expect(timeLimitError).toBeDefined();
    });
  });

  describe('UpdateQuizDto', () => {
    it('should validate a valid update DTO', async () => {
      const validDto = {
        title: 'Updated Quiz Title',
        description: 'Updated Description',
        deadline: new Date('2025-12-31'),
        isPublished: true,
        timeLimit: 120,
      };

      const dto = plainToClass(UpdateQuizDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate partial update DTO', async () => {
      const validDto = {
        title: 'Updated Quiz Title',
      };

      const dto = plainToClass(UpdateQuizDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when timeLimit is negative', async () => {
      const invalidDto = {
        timeLimit: -5,
      };

      const dto = plainToClass(UpdateQuizDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const timeLimitError = errors.find(
        (error) => error.property === 'timeLimit',
      );
      expect(timeLimitError).toBeDefined();
    });
  });

  describe('CreateQuizQuestionDto', () => {
    it('should validate a valid question DTO', async () => {
      const validDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        question_no: 1,
        question_type: 'MCQ', // Use the correct enum value
        question: 'What is 2+2?',
        correct_answer: 'A',
      };

      const dto = plainToClass(CreateQuizQuestionDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation when quizId is not UUID', async () => {
      const invalidDto = {
        quizId: 'invalid-uuid',
        question_no: 1,
        question_type: 'MCQ', // Use correct enum value
        question: 'What is 2+2?',
        correct_answer: 'A',
      };

      const dto = plainToClass(CreateQuizQuestionDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const quizIdError = errors.find((error) => error.property === 'quizId');
      expect(quizIdError).toBeDefined();
    });
    it('should fail validation when question_no is not a positive integer', async () => {
      const invalidDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        question_no: 'not-a-number', // Use string instead of number to trigger validation error
        question_type: 'MCQ',
        question: 'What is 2+2?',
        correct_answer: 'A',
      };

      const dto = plainToClass(CreateQuizQuestionDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const questionNoError = errors.find(
        (error) => error.property === 'question_no',
      );
      expect(questionNoError).toBeDefined();
    });
  });

  describe('CreateQuizAttemptDto', () => {
    it('should validate a valid attempt DTO', async () => {
      const validDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        attempt_no: 1,
        score: 85,
        time_taken: 45,
        submitted_at: new Date(),
        answers: {
          // Use object instead of array since DTO expects @IsObject
          '1': 'A',
          '2': 'B',
        },
      };

      const dto = plainToClass(CreateQuizAttemptDto, validDto);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
    it('should fail validation when score is not a number', async () => {
      const invalidDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        attempt_no: 1,
        score: 'not-a-number', // String instead of number
        time_taken: 45,
        submitted_at: new Date(),
        answers: { '1': 'A' },
      };

      const dto = plainToClass(CreateQuizAttemptDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const scoreError = errors.find((error) => error.property === 'score');
      expect(scoreError).toBeDefined();
    });
    it('should fail validation when time_taken is not a number', async () => {
      const invalidDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        attempt_no: 1,
        score: 85,
        time_taken: 'not-a-number', // String instead of number
        submitted_at: new Date(),
        answers: { '1': 'A' },
      };

      const dto = plainToClass(CreateQuizAttemptDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const timeTakenError = errors.find(
        (error) => error.property === 'time_taken',
      );
      expect(timeTakenError).toBeDefined();
    });

    it('should fail validation when answers is not an array', async () => {
      const invalidDto = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        attempt_no: 1,
        score: 85,
        time_taken: 45,
        submitted_at: new Date(),
        answers: 'not-an-array',
      };

      const dto = plainToClass(CreateQuizAttemptDto, invalidDto);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const answersError = errors.find((error) => error.property === 'answers');
      expect(answersError).toBeDefined();
    });
  });
});
