import { NestFactory } from '@nestjs/core';
import { ChatMsModule } from './chat-ms.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exception.filter';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ChatMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: isDocker ? '0.0.0.0' : '127.0.0.1',
        port: 4005,
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
}
bootstrap();
