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
import { startOfDay, subDays, isSameDay, endOfDay, format } from 'date-fns';
import { DailyActiveUsers } from './entity/daily-active-users.entity';
// import { Cron, CronExpression } from '@nestjs/schedule';

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

    @InjectRepository(DailyActiveUsers)
    private readonly dailyActiveUsersRepo: Repository<DailyActiveUsers>,
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

      if (role.toUpperCase() === 'USER' || role.toUpperCase() === 'TUTOR') {
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

      // Create a session entry for activities that require time tracking
      const timedActivities: ActivityType[] = [
        ActivityType.STARTED_QUIZ,
        ActivityType.VIEWED_FLASHCARDS,
        ActivityType.VIEWED_STUDY_PLAN,
        ActivityType.VIEWED_RESOURCE,
        ActivityType.VIEWED_CHAT,
      ];

      if (timedActivities.includes(activity_type)) {
        const session = this.userSessionRepo.create({
          user_id,
          activity_log_id: saved.id,
          started_at: new Date(), // Record when session begins
          duration_seconds: 0, // Initially 0, can update when session ends
        });

        await this.userSessionRepo.save(session);

        this.logger.debug(
          `Activity started: ${activity_type} by ${role} (${user_id})`,
        );
      }

      this.logger.debug(
        `Activity logged: ${activity_type} by ${role} (${user_id})`,
      );

      return {
        success: true,
        data: saved.id,
        message: 'Activity logged successfully',
        status: 200,
      };
    } catch (error) {
      this.logger.error('Failed to log user activity', error.stack);
      return {
        success: false,
        message: 'Failed to log user activity',
        status: 500,
      };
    }
  }

  // =============================================
  // UPDATE STREAK LOGIC
  // =============================================

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

  // =============================================
  // UPDATE SESSION ENDTIME
  // =============================================

  async updateSessionEndTime(sessionId: string) {
    try {
      // Fetch the session
      const session = await this.userSessionRepo.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        this.logger.warn(`Session not found: ${sessionId}`);
        return {
          success: false,
          message: 'Session not found',
          status: 404,
        };
      }

      // Check if already ended
      if (session.ended_at) {
        this.logger.debug(`Session ${sessionId} already ended`);
        return {
          success: true,
          message: 'Session already ended',
        };
      }

      // Update end time and duration
      const now = new Date();
      session.ended_at = now;
      session.duration_seconds = Math.floor(
        (now.getTime() - session.started_at.getTime()) / 1000,
      );

      await this.userSessionRepo.save(session);

      this.logger.debug(
        `Session ${sessionId} ended. Duration: ${session.duration_seconds}s`,
      );

      return {
        success: true,
        message: 'Session ended successfully',
        data: {
          session_id: session.id,
          duration_seconds: session.duration_seconds,
        },
      };
    } catch (error) {
      this.logger.error('Failed to update session end time', error.stack);
      return {
        success: false,
        message: 'Error updating session end time',
        status: 500,
      };
    }
  }

  // =============================================
  // UPDATE DAILY ACTIVE USERS
  // =============================================

  // =============================================
  // BASE FUNCTION – works for both cron & live requests
  // =============================================

  private async calculateAndStoreDailyActiveUsers(dateRange?: {
    start: Date;
    end: Date;
    label?: string;
  }) {
    const { start, end, label } = dateRange || {
      // Default: previous day (for cron)
      start: startOfDay(subDays(new Date(), 1)),
      end: endOfDay(subDays(new Date(), 1)),
      label: 'yesterday',
    };

    // Get unique user_ids who logged any activity in that date range
    const logs = await this.userActivityRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.user_id', 'user_id')
      .where('log.created_at BETWEEN :start AND :end', { start, end })
      .getRawMany();

    const activeUserCount = logs.length;

    // Use the "start" date (the day being analyzed)
    const dayLabel = format(start, 'yyyy-MM-dd');

    let dailyRecord = await this.dailyActiveUsersRepo.findOne({
      where: { date: start },
    });

    if (dailyRecord) {
      dailyRecord.active_users = activeUserCount;
    } else {
      dailyRecord = this.dailyActiveUsersRepo.create({
        date: dayLabel,
        active_users: activeUserCount,
      });
    }

    await this.dailyActiveUsersRepo.save(dailyRecord);

    this.logger.log(
      `Daily active users recorded for ${label ?? dayLabel}: ${activeUserCount}`,
    );
  }

  // -- Crohn Job to calculate daily active users for the past day

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async recordDailyActiveUsers() {
    this.logger.log('Running daily active user aggregation job...');
    await this.calculateAndStoreDailyActiveUsers(); // no params → uses yesterday by default
  }

  // =============================================
  // FETCH DAILY ACTIVE USERS FOR A DATE RANGE
  // =============================================

  async fetchDailyActiveUsersForRange(dateRange: { start: Date; end: Date }) {
    try {
      //Always calculate and store today's DAU first
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      await this.calculateAndStoreDailyActiveUsers({
        start: todayStart,
        end: todayEnd,
        label: 'today',
      });

      // Determine range for fetching
      const start = startOfDay(dateRange.start);
      const end = endOfDay(dateRange.end);

      // Query the dailyActiveUsers table
      const query = this.dailyActiveUsersRepo
        .createQueryBuilder('dau')
        .where('dau.date BETWEEN :start AND :end', { start, end })
        .orderBy('dau.date', 'ASC');

      const records = await query.getMany();

      //Map results to desired JSON
      const result = records.map((r) => ({
        date: format(new Date(r.date), 'yyyy-MM-dd'),
        active_users: r.active_users,
      }));

      return {
        success: true,
        message: 'Daily active users fetched successfully',
        data: result,
        status: 200,
      };
    } catch (error) {
      this.logger.error('Failed to fetch daily active users', error.stack);
      return {
        success: false,
        message: 'Failed to fetch daily active users',
        status: 500,
      };
    }
  }
}
