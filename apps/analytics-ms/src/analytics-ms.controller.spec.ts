import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsMsController } from './analytics-ms.controller';
import { AnalyticsMsService } from './analytics-ms.service';

describe('AnalyticsMsController', () => {
  let analyticsMsController: AnalyticsMsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsMsController],
      providers: [AnalyticsMsService],
    }).compile();

    analyticsMsController = app.get<AnalyticsMsController>(AnalyticsMsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(analyticsMsController.getHello()).toBe('Hello World!');
    });
  });
});
