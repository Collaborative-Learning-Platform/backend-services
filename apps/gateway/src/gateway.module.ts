// apps/gateway/src/gateway.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';


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
      name: 'USERS_SERVICE',
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 4001, 
      },
    },
    ]),
  ],
  controllers: [AuthController, UsersController],
})
export class GatewayModule {}
