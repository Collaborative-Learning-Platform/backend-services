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
import { startOfDay, subDays, isSameDay } from 'date-fns';

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

      if (role === 'STUDENT' || role === 'TUTOR') {
        // Check last_active_date first
        const streak = await this.userStreakRepo.findOne({
          where: { user_id },
        });
        const today = startOfDay(new Date());

        if (
          !streak ||
          !streak.last_active_date ||
          !isSameDay(streak.last_active_date, today)
        ) {
          // Only call update if the user hasn't been active today
          await this.updateUserStreak(user_id);
        }
      }

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

  // ---------------------------
  // Update streak logic
  // ---------------------------
  private async updateUserStreak(user_id: string) {
    const today = startOfDay(new Date());

    let streak = await this.userStreakRepo.findOne({ where: { user_id } });

    if (!streak) {
      streak = this.userStreakRepo.create({
        user_id,
        current_streak_days: 1,
        longest_streak_days: 1,
        last_active_date: today,
      });
    } else {
      const lastActive = streak.last_active_date
        ? startOfDay(streak.last_active_date)
        : null;

      if (lastActive && isSameDay(lastActive, today)) {
        // Already updated today → do nothing
        return streak;
      }

      const yesterday = subDays(today, 1);
      if (lastActive && isSameDay(lastActive, yesterday)) {
        streak.current_streak_days += 1; // Increment streak
      } else {
        streak.current_streak_days = 1; // Reset streak
      }

      // Update longest streak if needed
      if (streak.current_streak_days > streak.longest_streak_days) {
        streak.longest_streak_days = streak.current_streak_days;
      }

      streak.last_active_date = today;
    }

    return this.userStreakRepo.save(streak);
  }
}
