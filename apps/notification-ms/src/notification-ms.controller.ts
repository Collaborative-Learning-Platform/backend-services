import { Controller, Get } from '@nestjs/common';
import { NotificationMsService } from './notification-ms.service';

@Controller()
export class NotificationMsController {
  constructor(private readonly notificationMsService: NotificationMsService) {}

  @Get()
  getHello(): string {
    return this.notificationMsService.getHello();
  }
}
