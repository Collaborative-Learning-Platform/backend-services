import { NestFactory } from '@nestjs/core';
import { QuizMsModule } from './quiz-ms.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';


const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    QuizMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: isDocker ? '0.0.0.0' : '127.0.0.1',
        port: 4004, 
      },
    },
  );

  // Apply global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Apply global exception filter
  // app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen();
  console.log('Quiz microservice is listening on TCP port 4004');
}

bootstrap();
