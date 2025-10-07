import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ActivityCategory,
  ActivityMessageMap,
  ActivityType,
  UserActivityLog,
} from './entity/user-activity-log.entity';
import { UserActivitySession } from './entity/user-activity-session.entity';
import { DocumentActivitySession } from './entity/document-activity-session.entity';
import { Repository } from 'typeorm';
import { UserStreak } from './entity/user-streak.entity';

@Injectable()
export class AnalyticsMsService {
  private readonly logger = new Logger(AnalyticsMsService.name);

  constructor(
    @InjectRepository(UserActivityLog)
    private readonly userActivityRepo: Repository<UserActivityLog>,

    @InjectRepository(UserActivitySession)
    private readonly userSessionRepo: Repository<UserActivitySession>,

    @InjectRepository(DocumentActivitySession)
    private readonly documentSessionRepo: Repository<DocumentActivitySession>,

    @InjectRepository(UserStreak)
    private readonly userStreakRepo: Repository<UserStreak>,
  ) {}

  // =============================================
  // USER ACTIVITY LOGGING
  // =============================================

  async logUserActivity(payload: {
    user_id: string;
    role: 'STUDENT' | 'TUTOR' | 'ADMIN';
    category: ActivityCategory;
    activity_type: ActivityType;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const { user_id, role, category, activity_type, description, metadata } =
        payload;

      const log = this.userActivityRepo.create({
        user_id,
        role,
        category,
        activity_type,
        description:
          description ||
          ActivityMessageMap[activity_type] ||
          'Performed an activity',
        metadata,
      });

      const saved = await this.userActivityRepo.save(log);

      this.logger.debug(
        `Activity logged: ${activity_type} by ${role} (${user_id})`,
      );

      return {
        success: true,
        data: saved.id,
        message: 'Activity logged successfully',
      };
    } catch (error) {
      this.logger.error('Failed to log user activity', error.stack);
      return {
        success: false,
        message: 'Failed to log user activity',
      };
    }
  }
}
