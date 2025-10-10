import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import * as dotenv from 'dotenv';

// Load environment variables before using them
dotenv.config({ path: process.cwd() + '/env/.auth-ms.env' });
dotenv.config({ path: process.cwd() + '/env/.common.env' });

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: isDocker ? '0.0.0.0' : '127.0.0.1',
        port: 4000,
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
  console.log('Auth microservice is running on host ' + (isDocker ? '0.0.0.0' : '127.0.0.1') + ' and port 4000' );
}
bootstrap();
