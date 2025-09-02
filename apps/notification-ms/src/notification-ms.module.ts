import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { NotificationMsController } from './notification-ms.controller';
import { NotificationMsService } from './notification-ms.service';


const templateDir = join(__dirname,'src', 'templates');
console.log(__dirname)
console.log(templateDir)


@Module({
  imports: [
  MailerModule.forRoot({
      transport: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: 'collabarativelearningplatform@gmail.com',
          pass: 'uoyrcforiqrbonkp',
        },
      },
      defaults: {
        from: '"Learni" <no-reply@Learni.com>',
      },
      template: {
        dir: templateDir,  
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
  ],
  controllers: [NotificationMsController],
  providers: [NotificationMsService],
})
export class NotificationMsModule {}
