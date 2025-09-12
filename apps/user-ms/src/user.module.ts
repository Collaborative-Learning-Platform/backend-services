import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.user-ms.env' });

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
      logging: true, // Enable logging to see connection attempts
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {
  // constructor() {
  //   // Debug: Log environment variables
  //   console.log('Database Config:', {
  //     host: process.env.DB_HOST,
  //     port: process.env.DB_PORT,
  //     username: process.env.DB_USERNAME,
  //     database: process.env.DB_NAME,
  //     password: process.env.DB_PASSWORD ? '***masked***' : 'undefined',
  //   });
  // }
}
