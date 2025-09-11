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

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4002,
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
          entities: [Workspace, UserWorkspace, Group],
          synchronize: true,
          ssl: {
            rejectUnauthorized: false,
          },
        }),
    TypeOrmModule.forFeature([
      Workspace,
      UserWorkspace,
      Group
    ]),
  ],
  
  controllers: [WorkspaceMsController],
  providers: [WorkspaceMsService],
})
export class WorkspaceMsModule {}
