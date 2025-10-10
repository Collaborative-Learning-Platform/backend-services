import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        host: isDocker ? '0.0.0.0' : '127.0.0.1',
        port: 4001,
      },
    },
  );
  await app.listen();
  console.log('User microservice is running');
}
bootstrap();
