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
    }
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '1h' }, 
    }),
  ],
  controllers: [AuthController, UsersController, WorkspaceController, DashboardController],
})
export class GatewayModule {}
