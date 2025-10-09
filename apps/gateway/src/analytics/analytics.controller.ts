import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Res,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
  ) {}

  // --- End user session ---
  @Post('session/end/:sessionId')
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
