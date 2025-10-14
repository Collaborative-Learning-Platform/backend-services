import { Module } from '@nestjs/common';
import { AiMsController } from './ai-ms.controller';
import { AiMsService } from './ai-ms.service';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.ai-ms.env' });
dotenv.config({ path: process.cwd() + '/env/.common.env' });
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiProvider } from './providers/gemini.provider';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { StudyPlan } from './entity/study_plan.entity';
import { Flashcard } from './entity/flashcard.entity';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WORKSPACE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'workspace-ms' : '127.0.0.1',
          port: 4003,
        },
      },
      {
        name: 'QUIZ_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'quiz-ms' : '127.0.0.1',
          port: 4004,
        },
      },
      {
        name: 'STORAGE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'storage-ms' : '127.0.0.1',
          port: 4007,
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
      entities: [StudyPlan, Flashcard],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([StudyPlan, Flashcard]),
  ],
  controllers: [AiMsController],
  providers: [AiMsService, GeminiProvider],
})
export class AiMsModule {}
