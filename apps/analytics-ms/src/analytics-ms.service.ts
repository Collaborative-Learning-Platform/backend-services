import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ActivityCategory,
  ActivityMessageMap,
  ActivityType,
  UserActivityLog,
  RoleActivityMap,
} from './entity/user-activity-log.entity';
import {
  ChatMetadata,
  CreateQuizMetadata,
  DocumentMetadata,
  FlashcardCreateMetadata,
  FlashcardDeleteMetadata,
  GroupMetadata,
  QuizMetadata,
  ResourceMetadata,
  WhiteboardMetadata,
  WorkspaceAddMetadata,
  WorkspaceCreateMetadata,
} from 'libs/types/logger/logger-metadata.interface';
import { Repository, Not } from 'typeorm';
import { UserStreak } from './entity/user-streak.entity';
import { startOfDay, subDays, isSameDay, endOfDay, format } from 'date-fns';
import { DailyActiveUsers } from './entity/daily-active-users.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AnalyticsMsService {
  private readonly logger = new Logger(AnalyticsMsService.name);

  constructor(
    @InjectRepository(UserActivityLog)
    private readonly userActivityRepo: Repository<UserActivityLog>,

    @InjectRepository(UserStreak)
    private readonly userStreakRepo: Repository<UserStreak>,

    @InjectRepository(DailyActiveUsers)
    private readonly dailyActiveUsersRepo: Repository<DailyActiveUsers>,

    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
  ) {}

  // =============================================
  // USER ACTIVITY LOGGING
  // =============================================

  async logUserActivity(payload: {
    user_id: string;
    category: ActivityCategory;
    activity_type: ActivityType;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const { user_id, category, activity_type, description, metadata } =
        payload;

      // Get user role from auth service
      const userResponse = await lastValueFrom(
        this.authClient.send({ cmd: 'auth_get_user' }, { userId: user_id }),
      );

      if (!userResponse || !userResponse.success) {
        this.logger.error(
          `Failed to get user role for user ${user_id}`,
          userResponse,
        );
        return {
          success: false,
          message: 'Failed to get user role',
          status: 400,
        };
      }

      const role = userResponse.user.role;

      // Check if the activity type is allowed for this role
      const roleKey = role.toLowerCase() as keyof typeof RoleActivityMap;
      const allowedActivities = RoleActivityMap[roleKey];

      if (
        !allowedActivities ||
        !(allowedActivities as readonly ActivityType[]).includes(activity_type)
      ) {
        this.logger.warn(
          `Activity type ${activity_type} not allowed for role ${role} (user: ${user_id})`,
        );
        return {
          success: false,
          message: `Activity type ${activity_type} not allowed for role ${role}`,
          status: 403,
        };
      }

      const log = this.userActivityRepo.create({
        user_id,
        role,
        category,
        activity_type,
        description: description || ActivityMessageMap[activity_type],
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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

  // =============================================
  // FETCH RECENT USER ACTIVITY BY USER_ID
  // =============================================
  async fetchRecentUserActivities(user_id: string, limit = 5) {
    try {
      const activities = await this.userActivityRepo
        .createQueryBuilder('activity')
        .select([
          'activity.id as id',
          'activity.category as category',
          'activity.activity_type as activity_type',
          'activity.description as description',
          'activity.metadata as metadata',
          'activity.created_at as created_at',
        ])
        .where('activity.user_id = :user_id', { user_id })
        .andWhere('activity.activity_type != :login', {
          login: ActivityType.LOGIN,
        })
        .orderBy('activity.created_at', 'DESC')
        .limit(limit)
        .getRawMany();

      // Debug log to see raw activities with metadata
      activities.forEach((activity) => {
        console.log('Raw activity with metadata:', {
          type: activity.activity_type,
          metadata: activity.metadata,
          metadataType: typeof activity.metadata,
        });
      });

      // Format the response data using the Activity Message Map and metadata
      const formattedActivities = activities.map((activity) => {
        let description = ActivityMessageMap[activity.activity_type];
        const metadata = activity.metadata;

        // Add specific details based on activity type and metadata
        switch (activity.activity_type) {
          case ActivityType.DOWNLOADED_RESOURCE:
          case ActivityType.UPLOADED_RESOURCE:
            if (metadata) {
              const resourceMetadata = metadata as ResourceMetadata;
              if (resourceMetadata.fileName) {
                description = `${description} "${resourceMetadata.fileName}"`;
              }
            }
            break;
          case ActivityType.GENERATED_FLASHCARDS:
            if (metadata) {
              const flashcardMetadata =
                activity.metadata as FlashcardCreateMetadata;
              description = `${description} from resource ${flashcardMetadata.fileName}`;
            }
            break;
          case ActivityType.DELETED_FLASHCARDS:
            if (metadata) {
              const flashcardMetadata =
                activity.metadata as FlashcardDeleteMetadata;
              description = `${description} "${flashcardMetadata.title}"`;
            }
            break;
          case ActivityType.JOINED_WHITEBOARD:
            if (metadata) {
              const whiteboardMetadata =
                activity.metadata as WhiteboardMetadata;
              description = `${description} in group ${whiteboardMetadata.groupName}`;
            }
            break;
          case ActivityType.JOINED_DOCUMENT:
            if (metadata) {
              const documentMetadata = activity.metadata as DocumentMetadata;
              description = `${description} "${documentMetadata.title}"`;
            }
            break;
          case ActivityType.ADDED_TO_WORKSPACE:
            if (metadata) {
              const workspaceMetadata =
                activity.metadata as WorkspaceAddMetadata;
              description = `${description} "${workspaceMetadata.name}"`;
            }
            break;
          case ActivityType.ADDED_TO_GROUP:
            if (metadata) {
              const groupMetadata = activity.metadata as GroupMetadata;
              description = `${description} "${groupMetadata.name}"`;
            }
            break;
          case ActivityType.CREATED_WORKSPACE:
            if (metadata) {
              const workspaceMetadata =
                activity.metadata as WorkspaceCreateMetadata;
              description = `${description} "${workspaceMetadata.workspaceName}"`;
            }
          case ActivityType.CREATED_GROUP:
            if (metadata) {
              const groupMetadata = activity.metadata as GroupMetadata;
              description = `${description} "${groupMetadata.name} - (${groupMetadata.type}) group"`;
            }
            break;
          case ActivityType.DELETED_GROUP:
            if (metadata) {
              const groupMetadata = activity.metadata as GroupMetadata;
              description = `${description} "${groupMetadata.name} - (${groupMetadata.type}) group"`;
            }
            break;
          case ActivityType.POSTED_MESSAGE:
            if (metadata) {
              const chatMetadata = activity.metadata as ChatMetadata;
              description = `${description} in group "${chatMetadata.groupName}"`;
            }
            break;
          case ActivityType.GENERATED_STUDY_PLAN:
            description = `${description}`;
            break;
          case ActivityType.STARTED_QUIZ:
            if (metadata) {
              const quizMetadata = activity.metadata as QuizMetadata;
              description = `${description} "${quizMetadata.quizTitle}"`;
            }
            break;
          case ActivityType.SUBMITTED_QUIZ:
            if (metadata) {
              const quizMetadata = activity.metadata as QuizMetadata;
              description = `${description} "${quizMetadata.quizTitle}"`;
            }
            break;
          case ActivityType.CREATED_QUIZ:
            if (metadata) {
              const quizMetadata = activity.metadata as CreateQuizMetadata;
              description = `${description} "${quizMetadata.quizTitle}" for group "${quizMetadata.groupName}" (due: ${quizMetadata.dueDate})`;
            }
            break;
          default:
            break;
        }

        return {
          ...activity,
          description,
        };
      });

      const activitiesWithTime = formattedActivities.map((activity) => {
        console.log('Backend activity:', activity); // Debug log
        return {
          id: activity.id,
          category: activity.activity_category || activity.category, // Try both possible field names
          activity_type: activity.activity_type,
          description: activity.description,
          time: this.getTimeDifference(activity.created_at),
        };
      });

      return {
        success: true,
        data: activitiesWithTime,
        message: `Fetched ${formattedActivities.length} recent activities for user ${user_id}`,
        status: 200,
      };
    } catch (error) {
      this.logger.error('Failed to fetch recent user activities', error.stack);
      return {
        success: false,
        message: 'Failed to fetch recent user activities',
        status: 500,
      };
    }
  }

  // =============================================
  // GET USER CURRENT STREAK DAYS
  // =============================================

  async getUserCurrentStreakDays(user_id: string) {
    try {
      const streak = await this.userStreakRepo.findOne({ where: { user_id } });

      if (!streak) {
        this.logger.warn(`No streak record found for user ${user_id}`);
        return {
          success: true,
          data: 0,
          message: 'Current streak days fetched successfully',
        };
      }

      return {
        success: true,
        data: streak.current_streak_days,
        message: 'Current streak days fetched successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch current streak days for user ${user_id}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to fetch current streak days',
      };
    }
  }

  //Helper funciton to get elapsed time from activity
  private getTimeDifference(createdAt: Date | string): string {
    // Get current time in local timezone
    const now = new Date();
    const createdDate = new Date(createdAt);

    // Convert createdAt from UTC to local timezone for comparison
    const localOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localCreatedDate = new Date(createdDate.getTime() - localOffset);

    // Calculate difference using local times
    const diffMs = now.getTime() - localCreatedDate.getTime();

    // // Debug logs to track time calculation
    // console.log('Time calculation debug:', {
    //   nowLocal: now.toISOString(),
    //   createdAtUTC: createdDate.toISOString(),
    //   createdAtLocal: localCreatedDate.toISOString(),
    //   timezoneOffset: now.getTimezoneOffset(),
    //   diffMs,
    //   diffMinutes: Math.floor(diffMs / (1000 * 60)),
    //   diffHours: Math.floor(diffMs / (1000 * 60 * 60)),
    //   diffDays: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    // });

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}
