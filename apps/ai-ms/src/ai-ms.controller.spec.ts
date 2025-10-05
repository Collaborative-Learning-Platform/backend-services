import { Test, TestingModule } from '@nestjs/testing';
import { AiMsController } from './ai-ms.controller';
import { AiMsService } from './ai-ms.service';

describe('AiMsController', () => {
  let aiMsController: AiMsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AiMsController],
      providers: [AiMsService],
    }).compile();

    aiMsController = app.get<AiMsController>(AiMsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(aiMsController.getHello()).toBe('Hello World!');
    });
  });
});
