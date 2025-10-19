import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserPreferences } from './entity/user.entity';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.user-ms.env' });
dotenv.config({ path: process.cwd() + '/env/.common.env' });

dotenv.config({ path: process.cwd() + '/env/.common.env' });

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, UserPreferences],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
      logging: false, // Enable logging to see connection attempts
    }),
    TypeOrmModule.forFeature([User, UserPreferences]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
