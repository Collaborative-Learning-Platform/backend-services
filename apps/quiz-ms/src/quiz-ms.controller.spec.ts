import { Test, TestingModule } from '@nestjs/testing';
import { QuizMsController } from './quiz-ms.controller';
import { QuizMsService } from './quiz-ms.service';

describe('QuizMsController', () => {
  let quizMsController: QuizMsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [QuizMsController],
      providers: [QuizMsService],
    }).compile();

    quizMsController = app.get<QuizMsController>(QuizMsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(quizMsController.getHello()).toBe('Hello World!');
    });
  });
});
