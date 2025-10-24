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
      category: ActivityCategory;
      activity_type: ActivityType;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<ServiceResponse<any>> {
    return this.analyticsService.logUserActivity(payload);
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

  // =============================================
  // FETCH DAILY USER ENGAGEMENT FOR A TIME PERIOD
  // =============================================
  @MessagePattern({ cmd: 'get_daily_user_engagement' })
  async fetchDailyUserEngagement(
    @Payload() dateRange: { start: Date; end: Date },
  ): Promise<ServiceResponse<any>> {
    return this.analyticsService.fetchDailyUserEngagementForRange(dateRange);
  }

  // =============================================
  // FETCH RECENT USER ACTIVITIES FOR A USER
  // =============================================
  @MessagePattern({ cmd: 'get_recent_user_activities' })
  async fetchRecentUserActivities(
    @Payload() payload: { user_id: string },
  ): Promise<ServiceResponse<any>> {
    const { user_id } = payload;
    return this.analyticsService.fetchRecentUserActivities(user_id);
  }

  // =============================================
  // GET USER CURRENT STREAK DAYS
  // =============================================
  @MessagePattern({ cmd: 'get_user_current_streak_days' })
  async getUserCurrentStreakDays(
    @Payload() payload: { user_id: string },
  ): Promise<ServiceResponse<any>> {
    const { user_id } = payload;
    return this.analyticsService.getUserCurrentStreakDays(user_id);
  }

  // =============================================
  // FETCH USER GROUP ACTIVITIES
  // =============================================
  @MessagePattern({ cmd: 'get_user_group_activities' })
  async fetchUserGroupActivities(
    @Payload() payload: { user_id: string; limit?: number },
  ): Promise<ServiceResponse<any>> {
    const { user_id, limit } = payload;
    return this.analyticsService.fetchUserGroupActivities(user_id, limit || 5);
  }

  // =============================================
  // COMPARE ENGAGEMENT FOR LAST TWO WEEKS
  // =============================================
  @MessagePattern({ cmd: 'compare_and_get_last_two_weeks_engagement' })
  async compareLastTwoWeeksEngagement(): Promise<ServiceResponse<any>> {
    return this.analyticsService.compareLastTwoWeeksEngagement();
  }

  // =============================================
  // GET RECENT SYSTEM ACTIVITY FOR ADMIN
  // =============================================
  @MessagePattern({ cmd: 'get_recent_system_activity' })
  async getRecentSystemActivity(
    @Payload() payload: { limit?: number },
  ): Promise<ServiceResponse<any>> {
    const { limit } = payload;
    return this.analyticsService.getRecentSystemActivity(limit || 5);
  }
}
