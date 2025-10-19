import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.auth-ms.env' });
dotenv.config({ path: process.cwd() + '/env/.common.env' });
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from './entity/refreshToken.entity';
import { PasswordResetToken } from './entity/password.reset.token';
import { ClientsModule, Transport } from '@nestjs/microservices';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'user-ms' : '127.0.0.1',
          port: 4001,
        },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'notification-ms' : '127.0.0.1',
          port: 4002,
        },
      },
      {
        name: 'ANALYTICS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'analytics-ms' : '127.0.0.1',
          port: 4010,
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
      entities: [User, RefreshToken, PasswordResetToken],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([User, RefreshToken, PasswordResetToken]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
