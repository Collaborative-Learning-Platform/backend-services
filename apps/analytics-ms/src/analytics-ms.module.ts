import { Module } from '@nestjs/common';
import { AnalyticsMsController } from './analytics-ms.controller';
import { AnalyticsMsService } from './analytics-ms.service';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.common.env' });
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserActivityLog } from './entity/user-activity-log.entity';
import { DailyActiveUsers } from './entity/daily-active-users.entity';
import { UserStreak } from './entity/user-streak.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';

const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: isDocker ? 'auth-ms' : '127.0.0.1',
          port: 4000,
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
      entities: [UserActivityLog, DailyActiveUsers, UserStreak],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([UserActivityLog, DailyActiveUsers, UserStreak]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsMsController],
  providers: [AnalyticsMsService],
})
export class AnalyticsMsModule {}
