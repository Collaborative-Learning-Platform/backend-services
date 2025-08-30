import { NestFactory } from '@nestjs/core';
import { NotificationMsModule } from './notification-ms.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationMsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
