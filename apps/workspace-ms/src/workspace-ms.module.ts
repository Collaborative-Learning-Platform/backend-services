import { Module } from '@nestjs/common';
import { WorkspaceMsController } from './workspace-ms.controller';
import { WorkspaceMsService } from './workspace-ms.service';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.common.env' });
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Workspace} from './entity/workspace.entity';
import { UserWorkspace } from './entity/user-workspace.entity';
import { Group } from './entity/group.entity';
import { UserGroup } from './entity/user-group.entity';


const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'notification-ms' : '127.0.0.1',
          port: 4002,
        },
      },
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'auth-ms' : '127.0.0.1',
          port: 4000,
        },
      },
      {
        name: 'STORAGE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'storage-ms' : '127.0.0.1',
          port: 4007,
        },
      },
      {
        name: 'QUIZ_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'quiz-ms' : '127.0.0.1',
          port: 4004,
        },
      },
      {
        name:'DOCUMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'document-ms' : '127.0.0.1',
          port: 4006,
        },
      },
      {
        name :'CHAT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'chat-ms' : '127.0.0.1',
          port: 4005,
        },
      },
    ]),
    TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [Workspace, UserWorkspace, Group, UserGroup],
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
        }),
    TypeOrmModule.forFeature([
      Workspace,
      UserWorkspace,
      Group,
      UserGroup,
    ]),
  ],
  
  controllers: [WorkspaceMsController],
  providers: [WorkspaceMsService],
})
export class WorkspaceMsModule {}
