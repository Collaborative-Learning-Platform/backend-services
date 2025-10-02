import { NestFactory } from '@nestjs/core';
import { StorageMsModule } from './storage-ms.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exception.filter';



async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StorageMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 4007,
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
  await app.listen();
  console.log('Storage microservice is listening on port 4007');
}
bootstrap();
