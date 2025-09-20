import { Module } from '@nestjs/common';
import { ChatMsController } from './chat-ms.controller';
import { ChatMsService } from './chat-ms.service';
import * as dotenv from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entity/chat-message.entity';
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
             entities: [ChatMessage],
             synchronize: true,
             ssl: {
               rejectUnauthorized: false,
             },
           }),
    TypeOrmModule.forFeature([ChatMessage]),
  ],
  controllers: [ChatMsController],
  providers: [ChatMsService],
})
export class ChatMsModule {}
