import { Module } from '@nestjs/common';
import { NotificationMsController } from './notification-ms.controller';
import { NotificationMsService } from './notification-ms.service';

@Module({
  imports: [],
  controllers: [NotificationMsController],
  providers: [NotificationMsService],
})
export class NotificationMsModule {}
