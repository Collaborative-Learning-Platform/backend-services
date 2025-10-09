import { Module } from '@nestjs/common';
import { AnalyticsMsController } from './analytics-ms.controller';
import { AnalyticsMsService } from './analytics-ms.service';

@Module({
  imports: [],
  controllers: [AnalyticsMsController],
  providers: [AnalyticsMsService],
})
export class AnalyticsMsModule {}
