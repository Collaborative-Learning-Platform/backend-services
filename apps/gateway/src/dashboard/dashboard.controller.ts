import { Controller, Inject, Get, Res, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @Inject('WORKSPACE_SERVICE') private readonly WorkspaceClient: ClientProxy,
    @Inject('ANALYTICS_SERVICE') private readonly AnalyticsClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly AuthClient: ClientProxy,
  ) {}

  //getting workspace count and group count for a user
  //need to improve API design here to send

  // -> required data in frontend
  //   const [dashboardData, setDashboardData] = useState<{
  //     workspaces: number;
  //     groups: number;
  //     quizzes: any[];
  //     studyStreak: number;
  //     recentActivity: any[];
  //   }>({
  //     workspaces: 0,
  //     groups: 0,
  //     quizzes: [],
  //     studyStreak: 0,
  //     recentActivity: [],
  //   });

  // =============================================
  // FOR USER DASHBOARD
  // =============================================

  @Get('userStats/:user_id')
  async getUserStats(@Param('user_id') userId: string, @Res() res: Response) {
    try {
      const workspaceResponse = await lastValueFrom(
        this.WorkspaceClient.send({ cmd: 'get_user_stats' }, { userId }),
      );

      if (workspaceResponse?.error) {
        const ret = handleValidationError(workspaceResponse.error);
        return res.json(ret);
      }

      if (!workspaceResponse?.success) {
        return res.json({
          success: false,
          message:
            workspaceResponse.message || 'Failed to retrieve user statistics',
          status: workspaceResponse.status || 400,
        });
      }

      const streakResponse = await lastValueFrom(
        this.AnalyticsClient.send(
          { cmd: 'get_user_current_streak_days' },
          { user_id: userId },
        ),
      );

      if (streakResponse?.error) {
        const ret = handleValidationError(streakResponse.error);
        return res.json(ret);
      }

      if (!streakResponse?.success) {
        return res.json({
          success: false,
          message: streakResponse.message || 'Failed to retrieve user streak',
          status: streakResponse.status || 400,
        });
      }

      return res.json({
        success: true,
        data: {
          ...workspaceResponse.data,
          studyStreak: streakResponse.data,
        },
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error fetching user statistics and streak',
        error: error.message,
      });
    }
  }

  @Get('recentActivity/:user_id')
  async getRecentUserActivity(
    @Param('user_id') userId: string,
    @Res() res: Response,
  ) {
    try {
      console.log(
        'Dashboard Controller: getRecentUserActivity called for user_id:',
        userId,
      );

      const response = await lastValueFrom(
        this.AnalyticsClient.send(
          { cmd: 'get_recent_user_activities' },
          { user_id: userId },
        ),
      );

      console.log(
        'Dashboard Controller: Analytics service response:',
        JSON.stringify(response, null, 2),
      );

      if (response?.error) {
        console.log(
          'Dashboard Controller: Response has error:',
          response.error,
        );
        const ret = handleValidationError(response.error);
        return res.json(ret);
      }

      if (!response?.success) {
        console.log('Dashboard Controller: Response not successful:', response);
        return res.json({
          success: false,
          message:
            response.message || 'Failed to retrieve recent user activities',
          status: response.status || 400,
        });
      }

      console.log(
        'Dashboard Controller: Returning successful response with data:',
        response.data,
      );
      return res.json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error fetching recent user activities',
        error: error.message,
      });
    }
  }

  // =============================================
  // FOR TUTOR DASHBOARD
  // =============================================
  @Get('groupActivity/:user_id')
  async getUserGroupActivities(
    @Param('user_id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const response = await lastValueFrom(
        this.AnalyticsClient.send(
          { cmd: 'get_user_group_activities' },
          { user_id: userId },
        ),
      );

      if (response?.error) {
        const ret = handleValidationError(response.error);
        return res.json(ret);
      }

      if (!response?.success) {
        return res.json({
          success: false,
          message:
            response.message || 'Failed to retrieve user group activities',
          status: response.status || 400,
        });
      }

      return res.json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error fetching user group activities',
        error: error.message,
      });
    }
  }

  // =============================================
  // FOR ADMIN DASHBOARD
  // =============================================

  @Get('adminStats')
  async getAdminStats(@Res() res: Response) {
    try {
      // Get the total number of users with changes from Auth-ms
      const authResponse = await lastValueFrom(
        this.AuthClient.send({ cmd: 'auth_get_users_count_with_changes' }, {}),
      );

      console.log('Auth Response:', JSON.stringify(authResponse, null, 2));

      if (authResponse?.error) {
        const ret = handleValidationError(authResponse.error);
        return res.json(ret);
      }
      if (!authResponse?.success) {
        return res.json({
          success: false,
          message:
            authResponse.message ||
            'Failed to retrieve user count with changes',
          status: authResponse.status || 400,
        });
      }

      const workspaceResponse = await lastValueFrom(
        this.WorkspaceClient.send(
          { cmd: 'get_workspace_and_group_count_with_changes' },
          {},
        ),
      );

      console.log(
        'Workspace Response:',
        JSON.stringify(workspaceResponse, null, 2),
      );

      if (workspaceResponse?.error) {
        const ret = handleValidationError(workspaceResponse.error);
        return res.json(ret);
      }
      if (!workspaceResponse?.success) {
        return res.json({
          success: false,
          message:
            workspaceResponse.message ||
            'Failed to retrieve workspace/group count',
          status: workspaceResponse.status || 400,
        });
      }

      const analyticsResponse = await lastValueFrom(
        this.AnalyticsClient.send(
          { cmd: 'compare_and_get_last_two_weeks_engagement' },
          {},
        ),
      );

      console.log(
        'Analytics Response:',
        JSON.stringify(analyticsResponse, null, 2),
      );

      if (analyticsResponse?.error) {
        const ret = handleValidationError(analyticsResponse.error);
        return res.json(ret);
      }
      if (!analyticsResponse?.success) {
        return res.json({
          success: false,
          message:
            analyticsResponse.message ||
            'Failed to retrieve analytics dashboard data for Admin',
          status: analyticsResponse.status || 400,
        });
      }

      const numWorkspaces = workspaceResponse.workspaces;
      const numGroups = workspaceResponse.groups;
      const workspaceCountChange = workspaceResponse.workspaceCountChange;
      const groupCountChange = workspaceResponse.groupCountChange;
      const workspacePercentChange = workspaceResponse.workspacePercentChange;
      const groupPercentChange = workspaceResponse.groupPercentChange;
      const lastWeekCounts = workspaceResponse.lastWeekCounts;
      const authInfo = authResponse.data;
      const engagementInfo = analyticsResponse.data;

      console.log('Final response data:', {
        numWorkspaces,
        numGroups,
        workspaceCountChange,
        groupCountChange,
        workspacePercentChange,
        groupPercentChange,
        lastWeekCounts,
        authInfo,
        engagementInfo,
      });

      return res.json({
        success: true,
        data: {
          workspaces: numWorkspaces,
          groups: numGroups,
          workspaceCountChange,
          groupCountChange,
          workspacePercentChange,
          groupPercentChange,
          lastWeekCounts,
          authInfo,
          engagementInfo,
        },
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error fetching admin dashboard stats',
        error: error.message,
      });
    }
  }

  @Get('systemActivity')
  async getSystemActivity(@Res() res: Response) {
    try {
      const response = await lastValueFrom(
        this.AnalyticsClient.send(
          { cmd: 'get_recent_system_activity' },
          { limit: 5 },
        ),
      );

      if (response?.error) {
        const ret = handleValidationError(response.error);
        return res.json(ret);
      }

      if (!response?.success) {
        return res.json({
          success: false,
          message:
            response.message || 'Failed to retrieve recent system activity',
          status: response.status || 400,
        });
      }

      return res.json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error fetching recent system activity',
        error: error.message,
      });
    }
  }

  @Get('dailyEngagement')
  async getDailyUserEngagement(@Res() res: Response) {
    try {
      // Default to last 14 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 14);

      const response = await lastValueFrom(
        this.AnalyticsClient.send(
          { cmd: 'get_daily_user_engagement' },
          { 
            start: startDate,
            end: endDate,
          },
        ),
      );

      if (response?.error) {
        const ret = handleValidationError(response.error);
        return res.json(ret);
      }

      if (!response?.success) {
        return res.json({
          success: false,
          message:
            response.message || 'Failed to retrieve daily user engagement',
          status: response.status || 400,
        });
      }

      return res.json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      return res.json({
        success: false,
        message: 'Error fetching daily user engagement',
        error: error.message,
      });
    }
  }
}
