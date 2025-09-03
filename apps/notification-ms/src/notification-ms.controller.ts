import { Controller } from '@nestjs/common';
import { NotificationMsService } from './notification-ms.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserBulkCreatedEventDto } from './dto/user-bulk-created.dto';
import { MailDataDto } from './dto/mailData.dto';

@Controller()
export class NotificationMsController {
  constructor(private readonly notificationMsService: NotificationMsService) {}

  // @EventPattern('user_bulk_created')
  // async handleUserBulkCreated(@Payload() data: UserBulkCreatedEventDto) {
  //   await this.notificationMsService.handleUserBulkCreated(data);
  // }

  @EventPattern('notify')
  async handleNotify(@Payload() data: MailDataDto) {
    await this.notificationMsService.handleNotify(data);
  }
}
