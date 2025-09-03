import { Test, TestingModule } from '@nestjs/testing';
import { NotificationMsController } from './notification-ms.controller';
import { NotificationMsService } from './notification-ms.service';

describe('NotificationMsController', () => {
  let notificationMsController: NotificationMsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationMsController],
      providers: [NotificationMsService],
    }).compile();

    notificationMsController = app.get<NotificationMsController>(NotificationMsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(notificationMsController.getHello()).toBe('Hello World!');
    });
  });
});
