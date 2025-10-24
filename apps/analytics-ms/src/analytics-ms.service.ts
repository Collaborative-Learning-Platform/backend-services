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
import { Repository, Not, Between } from 'typeorm';
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

    @Inject('WORKSPACE_SERVICE')
    private readonly workspaceClient: ClientProxy,
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

  // Returns the count of unique users active from start of today to now
  private async getActiveUsersToday() {
    const start = startOfDay(new Date());
    const end = new Date();

    const logs = await this.userActivityRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.user_id', 'user_id')
      .where('log.created_at BETWEEN :start AND :end', { start, end })
      .getRawMany();

    return logs.length;
  }

  private async storeActiveUsersUptoNowToday() {
    const start = startOfDay(new Date());
    const end = new Date();

    const logs = await this.userActivityRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.user_id', 'user_id')
      .where('log.created_at BETWEEN :start AND :end', { start, end })
      .getRawMany();

    const activeUserCount = logs.length;

    // Find or create today's record
    let dailyRecord = await this.dailyActiveUsersRepo.findOne({
      where: { date: start },
    });

    if (dailyRecord) {
      dailyRecord.active_users = activeUserCount;
    } else {
      dailyRecord = this.dailyActiveUsersRepo.create({
        active_users: activeUserCount,
        total_users: 0,
        engagement: 0,
      });

      await this.dailyActiveUsersRepo.save(dailyRecord);
    }

    await this.dailyActiveUsersRepo.save(dailyRecord);

    this.logger.log(
      `Stored today's active users: ${activeUserCount} in daily_active_users table`,
    );
  }

  private async calculateAndStoreDailyActiveUsers(date?: Date) {
    // If no date is provided, use yesterday; else, use the provided date (today)

    const targetDate = date ? new Date(date) : subDays(new Date(), 1);
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    // Get unique user_ids who logged any activity in that date range
    const logs = await this.userActivityRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.user_id', 'user_id')
      .where('log.created_at BETWEEN :start AND :end', { start, end })
      .getRawMany();

    const activeUserCount = logs.length;
    const dayLabel = format(start, 'yyyy-MM-dd');

    // Use the Date object for DB lookup, not the string label
    let dailyRecord = await this.dailyActiveUsersRepo.findOne({
      where: { date: start },
    });

    if (dailyRecord) {
      dailyRecord.active_users = activeUserCount;
    } else {
      dailyRecord = this.dailyActiveUsersRepo.create({
        active_users: activeUserCount,
      });
    }

    await this.dailyActiveUsersRepo.save(dailyRecord);

    this.logger.log(
      `Daily active users recorded for ${dayLabel}: ${activeUserCount}`,
    );
  }

  private async calculateAndStoreDailyEngagement(date?: Date) {
    // If no date is provided, use yesterday; else, use the provided date (today)
    const targetDate = date ? new Date(date) : subDays(new Date(), 1);

    let dailyRecord = await this.dailyActiveUsersRepo.findOne({
      where: { date: startOfDay(targetDate) },
    });

    if (!dailyRecord || dailyRecord.active_users == null) {
      throw new Error('Daily active user count not found for the given day');
    }

    // Fetch total users from Auth-ms
    const userCountResponse = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_get_users_count' }, {}),
    );

    const totalUsers = userCountResponse?.data?.totalCount ?? 0;

    // Calculate engagement percentage using numeric active_users value
    const activeUserCount = dailyRecord.active_users ?? 0;
    const engagement =
      totalUsers > 0 ? (activeUserCount / totalUsers) * 100 : 0;

    const dayLabel = format(targetDate, 'yyyy-MM-dd');

    // Update and save the existing record
    dailyRecord.total_users = totalUsers;
    dailyRecord.engagement = engagement;

    await this.dailyActiveUsersRepo.save(dailyRecord);

    this.logger.log(
      `Daily engagement recorded for ${dayLabel}: active=${activeUserCount}, total=${totalUsers}, engagement=${engagement.toFixed(2)}%`,
    );
  }

  // -- Crohn Job to calculate daily active users + engagement for the past day

  @Cron('22 23 * * *')
  async recordDailyActiveUsers() {
    this.logger.log('Running daily active user aggregation job...');
    await this.calculateAndStoreDailyActiveUsers(); // no params → uses yesterday by default
  }

  @Cron('23 23 * * *') // Runs at 12:30 AM every day
  async recordDailyEngagement() {
    this.logger.log('Running daily engagement aggregation job...');
    await this.calculateAndStoreDailyEngagement(); // no params → uses yesterday by default
  }

  // =============================================
  // FETCH DAILY ACTIVE USERS FOR A DATE RANGE
  // =============================================
  async fetchDailyActiveUsersForRange(dateRange: { start: Date; end: Date }) {
    try {
      await this.storeActiveUsersUptoNowToday();

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
  // FETCH DAILY USER ENGAGEMENT FOR A DATE RANGE
  // =============================================
  async fetchDailyUserEngagementForRange(dateRange: {
    start: Date;
    end: Date;
  }) {
    try {
      // Determine range for fetching (up to previous day only)
      const start = startOfDay(dateRange.start);
      const end = startOfDay(subDays(new Date(), 1)); // Only up to previous day

      // Ensure we don't fetch future dates
      const actualEnd = dateRange.end < end ? startOfDay(dateRange.end) : end;

      // Query the dailyActiveUsers table for engagement data
      const records = await this.dailyActiveUsersRepo.find({
        where: {
          date: Between(start, actualEnd),
        },
        order: {
          date: 'ASC',
        },
      });

      // Map results to desired JSON format
      const result = records.map((r) => ({
        date: format(new Date(r.date), 'yyyy-MM-dd'),
        active_users: r.active_users,
        total_users: r.total_users,
        engagement: r.engagement, // Already stored as percentage
      }));

      return {
        success: true,
        message: 'Daily user engagement fetched successfully',
        data: result,
        status: 200,
      };
    } catch (error) {
      this.logger.error('Failed to fetch daily user engagement', error.stack);
      return {
        success: false,
        message: 'Failed to fetch daily user engagement',
        status: 500,
      };
    }
  }

  private async getAverageEngagementForPeriod(start: Date, end: Date) {
    const records = await this.dailyActiveUsersRepo.find({
      where: {
        date: Between(startOfDay(start), startOfDay(end)),
      },
    });

    if (!records.length) return 0;

    const totalEngagement = records.reduce(
      (sum, r) => sum + (r.engagement ?? 0),
      0,
    );
    return totalEngagement / records.length;
  }

  async compareLastTwoWeeksEngagement() {
    try {
      const today = startOfDay(new Date());

      // Last 7 days: today - 6 to today
      const last7Start = subDays(today, 6);
      const last7End = today;

      // Previous 7 days: today - 13 to today - 7
      const prev7Start = subDays(today, 13);
      const prev7End = subDays(today, 7);

      const last7Avg = await this.getAverageEngagementForPeriod(
        last7Start,
        last7End,
      );
      const prev7Avg = await this.getAverageEngagementForPeriod(
        prev7Start,
        prev7End,
      );

      return {
        success: true,
        data: {
          last7Avg,
          prev7Avg,
          difference: last7Avg - prev7Avg,
          percentChange:
            prev7Avg === 0 ? null : ((last7Avg - prev7Avg) / prev7Avg) * 100,
        },
        message: 'Engagement comparison fetched successfully',
      };
    } catch (err) {
      this.logger.error('Error occurred when comparing engagement');
      return {
        success: false,
        message: 'Error occurred when comparing engagement',
        status: 500,
      };
    }
  }

  // =============================================
  // HELPER: FORMAT ACTIVITY ENTRIES WITH DESCRIPTIONS AND TIME
  // =============================================

  private formatActivitiesWithDescriptionAndTime(activities: any[]): any[] {
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
            const whiteboardMetadata = activity.metadata as WhiteboardMetadata;
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
            const workspaceMetadata = activity.metadata as WorkspaceAddMetadata;
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
          break;
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

      const formattedActivity = {
        ...activity,
        description,
      };

      // Build the formatted object
      const formatted: any = {
        id: formattedActivity.id,
        category: formattedActivity.category,
        activity_type: formattedActivity.activity_type,
        description: formattedActivity.description,
        metadata: formattedActivity.metadata, // Include metadata field
        time: this.getTimeDifference(activity.created_at),
      };

      // Include user_id if present
      if ('user_id' in activity) {
        formatted.user_id = activity.user_id;
      }

      return formatted;
    });

    return formattedActivities;
  }

  //Private function to build UserIds
  private buildUserIdNameMap(userRes: any): Record<string, string> {
    const userIdNameMap: Record<string, string> = {};
    if (userRes && userRes.success && Array.isArray(userRes.users)) {
      userRes.users.forEach((user: any) => {
        if (user.userId && user.name) {
          userIdNameMap[user.userId] = user.name;
        }
      });
    }
    return userIdNameMap;
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
      console.log(
        'Analytics Service: fetchRecentUserActivities called for user_id:',
        user_id,
      );
      console.log(
        'Analytics Service: Found activities count:',
        activities.length,
      );
      activities.forEach((activity, index) => {
        console.log(`Analytics Service: Activity ${index}:`, {
          id: activity.id,
          type: activity.activity_type,
          category: activity.category,
          description: activity.description,
          metadata: activity.metadata,
          metadataType: typeof activity.metadata,
          created_at: activity.created_at,
        });
      });

      // Format activities using the helper function
      const formattedActivities =
        this.formatActivitiesWithDescriptionAndTime(activities);

      console.log(
        'Analytics Service: Formatted activities:',
        JSON.stringify(formattedActivities, null, 2),
      );
      console.log(
        'Analytics Service: Returning response with data length:',
        formattedActivities.length,
      );

      return {
        success: true,
        data: formattedActivities,
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

  // =============================================
  // FETCH USER GROUP ACTIVITIES
  // =============================================
  async fetchUserGroupActivities(user_id: string, limit = 10) {
    try {
      // First, get all groups the user belongs to from workspace-ms
      this.logger.debug('Calling workspace service to get user groups');
      const groupsResponse = await lastValueFrom(
        this.workspaceClient.send(
          { cmd: 'get_groups_by_user' },
          { userId: user_id },
        ),
      );

      this.logger.debug(
        'Groups response received:',
        JSON.stringify(groupsResponse),
      );

      // Build groupId to groupInfo map
      const groupInfoMap = {};
      if (!groupsResponse || !groupsResponse.success || !groupsResponse.data) {
        this.logger.error(
          `Failed to get groups for user ${user_id}. Response:`,
          JSON.stringify(groupsResponse),
        );
        return {
          success: false,
          message: 'Failed to get user groups',
          status: 400,
        };
      }

      groupsResponse.data.forEach((group) => {
        groupInfoMap[group.groupId] = {
          groupName: group.groupName,
          workspaceId: group.workspaceId,
          workspaceName: group.workspaceName,
        };
      });

      // Extract group IDs (use the keys from the map for consistency)
      const groupIds = Object.keys(groupInfoMap);
      this.logger.debug(
        `Found ${groupIds.length} groups for user ${user_id}:`,
        groupIds,
      );

      if (groupIds.length === 0) {
        this.logger.debug(`User ${user_id} doesn't belong to any groups`);
        // User doesn't belong to any groups
        return {
          success: true,
          data: [],
          message: 'User does not belong to any groups',
          status: 200,
        };
      }

      // Query activities where metadata->>'groupId' is in the list of group IDs
      this.logger.debug('Querying activities with groupIds:', groupIds);

      // First, let's see what raw activities look like
      const rawActivities = await this.userActivityRepo
        .createQueryBuilder('activity')
        .where(`activity.metadata->>'groupId' IN (:...groupIds)`, { groupIds })
        .andWhere('activity.activity_type != :login', {
          login: ActivityType.LOGIN,
        })
        .orderBy('activity.created_at', 'DESC')
        .limit(limit) // Use the provided limit for debugging
        .getMany();

      this.logger.debug(
        'Raw activities from database:',
        JSON.stringify(rawActivities, null, 2),
      );

      // If no activities found with metadata groupId, let's try a broader search
      // and then filter based on description patterns or other criteria
      let activities;
      if (rawActivities.length === 0) {
        this.logger.debug(
          'No activities found with metadata groupId, trying broader search...',
        );

        // Get recent activities and check if any descriptions contain group IDs
        activities = await this.userActivityRepo
          .createQueryBuilder('activity')
          .select([
            'activity.id as id',
            'activity.user_id as user_id',
            'activity.category as category',
            'activity.activity_type as activity_type',
            'activity.description as description',
            'activity.metadata as metadata',
            'activity.created_at as created_at',
          ])
          .andWhere('activity.activity_type != :login', {
            login: ActivityType.LOGIN,
          })
          .orderBy('activity.created_at', 'DESC')
          .limit(limit * 2) // Get more to filter
          .getRawMany();

        // Filter activities that mention any of our group IDs in description
        activities = activities
          .filter((activity) => {
            const description = activity.description || '';
            return groupIds.some((groupId) => description.includes(groupId));
          })
          .slice(0, limit);

        this.logger.debug(
          `Found ${activities.length} activities by description matching`,
        );
      } else {
        activities = await this.userActivityRepo
          .createQueryBuilder('activity')
          .select([
            'activity.id as id',
            'activity.user_id as user_id',
            'activity.category as category',
            'activity.activity_type as activity_type',
            'activity.description as description',
            'activity.metadata as metadata',
            'activity.created_at as created_at',
          ])
          .where(`activity.metadata->>'groupId' IN (:...groupIds)`, {
            groupIds,
          })
          .andWhere('activity.activity_type != :login', {
            login: ActivityType.LOGIN,
          })
          .andWhere('activity.user_id != :user_id', { user_id }) // <-- This line filters out user's own activities
          .orderBy('activity.created_at', 'DESC')
          .limit(limit)
          .getRawMany();
      }

      this.logger.debug(`Found ${activities.length} activities for groups`);

      // Let's also check if there are ANY activities with metadata
      const anyActivitiesWithMetadata = await this.userActivityRepo
        .createQueryBuilder('activity')
        .where('activity.metadata IS NOT NULL')
        .limit(3)
        .getMany();

      this.logger.debug(
        'Sample activities with metadata:',
        JSON.stringify(anyActivitiesWithMetadata, null, 2),
      );

      // Format activities using the helper function
      const formattedActivities =
        this.formatActivitiesWithDescriptionAndTime(activities);

      // 1. Collect unique user IDs from activities
      const userIds = Array.from(
        new Set(activities.map((a) => a.user_id).filter(Boolean)),
      );
      this.logger.debug(
        `Collected ${userIds.length} unique user IDs:`,
        userIds,
      );

      // Declare map in outer scope so it's available after the try/catch
      let userIdNameMap: Record<string, string> = {};

      if (userIds.length > 0) {
        try {
          // 2. Call batch endpoint
          this.logger.debug('Fetching user names from auth service');
          const userRes = await lastValueFrom(
            this.authClient.send({ cmd: 'get_users_by_ids' }, { userIds }),
          );
          this.logger.debug('User response received:', JSON.stringify(userRes));
          //buildUserIdNameMap
          userIdNameMap = this.buildUserIdNameMap(userRes);
        } catch (error) {
          this.logger.error(
            'Error fetching user_ids from auth-ms.service for usergroups recent activity Logging',
            error.stack,
          );
          return {
            success: false,
            message: 'Failed to fetch user information for group activities',
            status: 500,
          };
        }
      }

      this.logger.debug('Combining activities with user names and group info');
      this.logger.debug('GroupInfoMap contents:', JSON.stringify(groupInfoMap));

      const formattedWithNamesAndGroups = formattedActivities.map(
        (activity) => {
          this.logger.debug(
            'Processing activity metadata:',
            JSON.stringify(activity.metadata),
          );
          this.logger.debug('Looking for groupId:', activity.metadata?.groupId);
          this.logger.debug(
            'GroupInfo found:',
            groupInfoMap[activity.metadata?.groupId],
          );

          const result = {
            ...activity,
            user_name: activity.user_id
              ? userIdNameMap[activity.user_id] || 'Unknown User'
              : 'Unknown User',
            group_name: activity.metadata?.groupId
              ? groupInfoMap[activity.metadata.groupId]?.groupName ||
                'Unknown Group'
              : 'Unknown Group',
            workspace_id: activity.metadata?.groupId
              ? groupInfoMap[activity.metadata.groupId]?.workspaceId
              : undefined,
            workspace_name: activity.metadata?.groupId
              ? groupInfoMap[activity.metadata.groupId]?.workspaceName ||
                'Unknown Workspace'
              : 'Unknown Workspace',
          };
          this.logger.debug('Mapped activity:', JSON.stringify(result));
          return result;
        },
      );

      this.logger.debug(
        `Successfully processed ${formattedWithNamesAndGroups.length} group activities`,
      );
      return {
        success: true,
        data: formattedWithNamesAndGroups,
        message: `Fetched ${formattedWithNamesAndGroups.length} recent activities from user's groups`,
        status: 200,
      };
    } catch (error) {
      this.logger.error(
        'Failed to fetch user group activities - Error details:',
        error.stack,
      );
      this.logger.error('Error message:', error.message);
      return {
        success: false,
        message: 'Failed to fetch user group activities',
        status: 500,
      };
    }
  }

  //Helper function to get elapsed time from activity
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

  // =============================================
  // GET RECENT SYSTEM ACTIVITY FOR ADMIN
  // =============================================
  async getRecentSystemActivity(limit = 5) {
    try {
      const activities = await this.userActivityRepo
        .createQueryBuilder('activity')
        .select([
          'activity.id as id',
          'activity.user_id as user_id',
          'activity.role as role',
          'activity.category as category',
          'activity.activity_type as activity_type',
          'activity.description as description',
          'activity.metadata as metadata',
          'activity.created_at as created_at',
        ])
        .orderBy('activity.created_at', 'DESC')
        .limit(limit)
        .getRawMany();

      // Get unique user IDs to fetch user names
      const userIds = Array.from(
        new Set(activities.map((a) => a.user_id).filter(Boolean)),
      );

      let userIdNameMap: Record<string, string> = {};

      if (userIds.length > 0) {
        try {
          const userResponse = await lastValueFrom(
            this.authClient.send(
              { cmd: 'get_users_by_ids' },
              { userIds: userIds },
            ),
          );
          userIdNameMap = this.buildUserIdNameMap(userResponse);
        } catch (error) {
          this.logger.warn(
            'Failed to fetch user names for system activity',
            error,
          );
        }
      }

      // Format activities with user names and time
      const formattedActivities = activities.map((activity) => {
        const userName = userIdNameMap[activity.user_id] || 'Unknown User';

        return {
          id: activity.id,
          user_id: activity.user_id,
          user_name: userName,
          role: activity.role,
          category: activity.category,
          activity_type: activity.activity_type,
          description: activity.description,
          time: this.getTimeDifference(activity.created_at),
          created_at: activity.created_at,
          metadata: activity.metadata,
        };
      });

      return {
        success: true,
        data: formattedActivities,
        message: `Fetched ${formattedActivities.length} recent system activities`,
        status: 200,
      };
    } catch (error) {
      this.logger.error('Failed to fetch recent system activity', error.stack);
      return {
        success: false,
        message: 'Failed to fetch recent system activity',
        status: 500,
      };
    }
  }
}
