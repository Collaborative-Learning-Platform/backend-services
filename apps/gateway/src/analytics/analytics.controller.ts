import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Res,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';
import { AuthGuard } from '../guards/auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
  ) {}

  // --- Log user activity ---
  @Post('log-activity')
  @UseGuards(AuthGuard)
  async logUserActivity(
    @Body()
    data: {
      category: string;
      activity_type: string;
      description?: string;
      metadata?: Record<string, any>;
    },
    @Req() req: any,
    @Res() res: Response,
  ) {
    // Extract user details from the request (set by AuthGuard)
    const userId = req.user.userId;

    const response = await lastValueFrom(
      this.analyticsClient.send(
        { cmd: 'log_user_activity' },
        {
          user_id: userId,
          category: data.category,
          activity_type: data.activity_type,
          metadata: data.metadata,
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
        message: response.message || 'Failed to log user activity',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'User activity logged successfully',
      data: response.data,
    });
  }

  //

  // --- End user session ---
  @Post('session/end/:sessionId')
  @UseGuards(AuthGuard)
  async endUserSession(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.analyticsClient.send({ cmd: 'end_user_session' }, sessionId),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to end user session',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'User session ended successfully',
      data: response.data,
    });
  }

  // --- Fetch daily active users (optionally for a date range) ---
  @Get('daily-active-users')
  @UseGuards(AuthGuard)
  async getDailyActiveUsers(
    @Res() res: Response,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const dateRange =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;

    const response = await lastValueFrom(
      this.analyticsClient.send({ cmd: 'get_daily_active_users' }, dateRange),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to fetch daily active users',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'Daily active users fetched successfully',
      data: response.data,
    });
  }
}
