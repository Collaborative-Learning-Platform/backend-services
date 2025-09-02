import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.auth-ms.env' });
dotenv.config({ path: process.cwd() + '/env/.common.env' });
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity'; 
// import * as fs from 'fs';
// import * as path from 'path';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from './entity/refreshToken.entity';
import { ClientsModule,Transport } from '@nestjs/microservices';


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
      entities: [User, RefreshToken],
      synchronize: true,
      ssl: {
        // ca: fs.readFileSync(path.resolve(process.cwd(), 'env', 'aiven-ca.crt')).toString(),
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([
      User,
      RefreshToken
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '1h' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
