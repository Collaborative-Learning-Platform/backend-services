import { Module } from '@nestjs/common';
import { QuizMsController } from './quiz-ms.controller';
import { QuizMsService } from './quiz-ms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entity/quiz.entity';
import { QuizQuestion } from './entity/quiz-question.entity';
import { QuizAttempt } from './entity/quiz-attempt.entity';
import { Group } from '../../workspace-ms/src/entity/group.entity';
import { User } from '../../user-ms/src/entity/user.entity';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.common.env' });


@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, Group, User, QuizQuestion, QuizAttempt]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Group, Quiz, QuizQuestion, QuizAttempt],
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
