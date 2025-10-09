import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnalyticsMsService } from './analytics-ms.service';
import { ServiceResponse } from './interfaces/serviceresponse.interface';
import {
  ActivityCategory,
  ActivityType,
} from './entity/user-activity-log.entity';

@Controller('analytics')
export class AnalyticsMsController {
  private readonly logger = new Logger(AnalyticsMsController.name);

  constructor(private readonly analyticsService: AnalyticsMsService) {}

  // =============================================
  // LOG USER ACTIVITY
  // =============================================
  @MessagePattern({ cmd: 'log_user_activity' })
  async logUserActivity(
    @Payload()
    payload: {
      user_id: string;
      role: 'STUDENT' | 'TUTOR' | 'ADMIN';
      category: ActivityCategory;
      activity_type: ActivityType;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<ServiceResponse<any>> {
    return this.analyticsService.logUserActivity(payload);
  }

  // =============================================
  // RECORD SESSION END TIME
  // =============================================
  @MessagePattern({ cmd: 'end_user_session' })
  async endUserSession(
    @Payload() sessionId: string,
  ): Promise<ServiceResponse<any>> {
    return this.analyticsService.updateSessionEndTime(sessionId);
  }

  // =============================================
  // FETCH DAILY ACTIVE USERS FOR A TIME PERIOD
  // =============================================
  @MessagePattern({ cmd: 'get_daily_active_users' })
  async fetchDailyActiveUsers(
    @Payload() dateRange: { start: Date; end: Date },
  ): Promise<ServiceResponse<any>> {
    return this.analyticsService.fetchDailyActiveUsersForRange(dateRange);
  }
}
