import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceMsController } from './workspace-ms.controller';
import { WorkspaceMsService } from './workspace-ms.service';

describe('WorkspaceMsController', () => {
  let workspaceMsController: WorkspaceMsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceMsController],
      providers: [WorkspaceMsService],
    }).compile();

    workspaceMsController = app.get<WorkspaceMsController>(WorkspaceMsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(workspaceMsController.getHello()).toBe('Hello World!');
    });
  });
});
