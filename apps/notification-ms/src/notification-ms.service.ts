import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserBulkCreatedEventDto } from './dto/user-bulk-created.dto';
import { MailDataDto } from './dto/mailData.dto';

@Injectable()
export class NotificationMsService {
  private readonly logger = new Logger(NotificationMsService.name);

  constructor(private readonly mailerService: MailerService) {}

  // async handleUserBulkCreated(data: UserBulkCreatedEventDto) {
  //   for (const user of data.users) {
  //     try {
  //       await this.mailerService.sendMail({
  //         to: user.email,
  //         subject: 'Welcome to Our Platform 🎉',
  //         // template: 'welcome',
  //         html: `<h1>Welcome ${user.name}!</h1>
  //         <p>Your email: ${user.email}</p>
  //         <p>Your password: Abcd1234</p>
  //         <p>Change upon first login</p>`,
  //         context: { name: user.name, email: user.email },
  //       });
  //       this.logger.debug(`Sent welcome email to ${user.email}`);
  //     } catch (err) {
  //       this.logger.error(`Failed to send email to ${user.email}`, err.stack || err);
  //     }
  //   }
  // }

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
