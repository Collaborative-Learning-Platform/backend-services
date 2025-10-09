import { NestFactory } from '@nestjs/core';
import { AnalyticsMsModule } from './analytics-ms.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AnalyticsMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 4010,
      },
    },
  );

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen();
  console.log('Analytics Microservice is running on TCP port 4010');
}

bootstrap();
