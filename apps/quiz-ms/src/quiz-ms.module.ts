import { Module } from '@nestjs/common';
import { QuizMsController } from './quiz-ms.controller';
import { QuizMsService } from './quiz-ms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entity/quiz.entity';
import { QuizQuestion } from './entity/quiz-question.entity';
import { QuizAttempt } from './entity/quiz-attempt.entity';
import { User } from '../../user-ms/src/entity/user.entity';
import { Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';
import { ClientsModule } from '@nestjs/microservices';
dotenv.config({ path: process.cwd() + '/env/.common.env' });

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
        name: 'WORKSPACE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4003, 
        },
      },
    ]),
    TypeOrmModule.forFeature([Quiz, QuizQuestion, QuizAttempt]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [ Quiz, QuizQuestion, QuizAttempt],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  ],
  controllers: [QuizMsController],
  providers: [QuizMsService],
})
export class QuizMsModule {}
