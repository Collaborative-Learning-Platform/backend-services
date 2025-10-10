import { NestFactory } from '@nestjs/core';
import { WhiteboardMsModule } from './whiteboard-ms.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { bootstrapSyncServer } from './sync.server';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WhiteboardMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: isDocker ? '0.0.0.0' : '127.0.0.1',
        port: 4009,
      },
    },
  );
  await app.listen();
  console.log('Whiteboard microservice (TCP) listening on 4009');

  bootstrapSyncServer(8080);
}
bootstrap();
