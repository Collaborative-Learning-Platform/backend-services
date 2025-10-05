import { NestFactory } from '@nestjs/core';
import { WhiteboardMsModule } from './whiteboard-ms.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { bootstrapSyncServer } from './sync.server';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WhiteboardMsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 4008,
      },
    },
  );
  await app.listen();
  console.log('Whiteboard microservice (TCP) listening on 4008');

  bootstrapSyncServer(8080);
}
bootstrap();
