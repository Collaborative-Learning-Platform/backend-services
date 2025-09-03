import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { NotificationMsModule } from './notification-ms.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 4002,
      },
    },
  );
  app.useGlobalPipes(new ValidationPipe(
    {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    },
  ));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen();
  console.log('Notification microservice is running');
}
bootstrap();
