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
      const response = await lastValueFrom(
        this.AnalyticsClient.send(
          { cmd: 'get_recent_user_activities' },
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
            response.message || 'Failed to retrieve recent user activities',
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
        message: 'Error fetching recent user activities',
        error: error.message,
      });
    }
  }
}
