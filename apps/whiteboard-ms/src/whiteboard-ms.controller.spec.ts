import { Test, TestingModule } from '@nestjs/testing';
import { WhiteboardMsController } from './whiteboard-ms.controller';
import { WhiteboardMsService } from './whiteboard-ms.service';

describe('WhiteboardMsController', () => {
  let whiteboardMsController: WhiteboardMsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WhiteboardMsController],
      providers: [WhiteboardMsService],
    }).compile();

    whiteboardMsController = app.get<WhiteboardMsController>(WhiteboardMsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(whiteboardMsController.getHello()).toBe('Hello World!');
    });
  });
});
