import { NestFactory } from '@nestjs/core';
import { DocumentMsModule } from './document-ms.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { startHocuspocusCollabServer } from '../hocuspocus.server';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    DocumentMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: isDocker ? '0.0.0.0' : '127.0.0.1',
        port: 4006,
      },
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Start both servers concurrently
  await Promise.all([app.listen(), startHocuspocusCollabServer()]);

  console.log('Document microservice is running on TCP port 4006');
  console.log('Hocuspocus WebSocket server is running on port 1234');
}

bootstrap();
