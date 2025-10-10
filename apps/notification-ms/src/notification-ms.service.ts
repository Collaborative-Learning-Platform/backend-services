import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserBulkCreatedEventDto } from './dto/user-bulk-created.dto';
import { MailDataDto } from './dto/mailData.dto';

@Injectable()
export class NotificationMsService {
  private readonly logger = new Logger(NotificationMsService.name);

  constructor(private readonly mailerService: MailerService) {}


  async handleNotify(data: MailDataDto) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: data.subject,
        html: data.html,
      });
      this.logger.debug(`Sent notification email to ${data.email}`);
    } catch (err) {
      this.logger.error(`Failed to send notification email to ${data.email}`, err.stack || err);
    }
  }

}
