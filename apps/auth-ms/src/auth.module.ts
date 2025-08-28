import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.auth-ms.env' });
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity'; 
import * as fs from 'fs';
import * as path from 'path';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from './entity/refreshToken.entity';


@Module({
  imports: [
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
      secret: 'your_jwt_secret', 
      signOptions: { expiresIn: '1h' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
