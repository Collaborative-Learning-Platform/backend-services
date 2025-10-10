import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { NotificationMsController } from './notification-ms.controller';
import { NotificationMsService } from './notification-ms.service';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.notification-ms.env' });



@Module({
  imports: [
  MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: '"Learni" <no-reply@Learni.com>',
      },
    }),
  ],
  controllers: [NotificationMsController],
  providers: [NotificationMsService],
})
export class NotificationMsModule {}
