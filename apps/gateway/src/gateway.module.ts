// apps/gateway/src/gateway.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.gateway.env' });
import { WorkspaceController } from './workspace/workspace.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { ChatController } from './chat/chat.controller';
import { ChatGateway } from './chat/chat.gateway';
import { QuizController } from './quiz/quiz.controller';
import { StorageController } from './storage/storage.controller';
import { DocumentController } from './documents/documents.controller';
import { WhiteboardController } from './whiteboard/whiteboard.controller';
import { WhiteboardGateway } from './whiteboard/whiteboard.gateway';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4000,
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4001,
        },
      },
      {
        name: 'WORKSPACE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4003,
        },
      },
      {
        name: 'QUIZ_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4004,
        },
      },
      {
        name: 'CHAT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4005,
        },
      },
      {
        name: 'DOCUMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4006,
        },
      },
      {
        name: 'STORAGE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4007,
        },
      },
      {
        name: 'WHITEBOARD_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4008,
        },
      },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    WorkspaceController,
    DashboardController,
    QuizController,
    ChatController,
    StorageController,
    DocumentController,
    WhiteboardController,
  ],
  providers: [ChatGateway, WhiteboardGateway],
})
export class GatewayModule {}
