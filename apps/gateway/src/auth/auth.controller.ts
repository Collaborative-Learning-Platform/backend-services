import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpException,
  Body,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import * as multer from 'multer';
import { lastValueFrom } from 'rxjs';
import { handleValidationError } from '../utils/validationErrorHandler';
import { AuthGuard } from '../guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  async login(
    @Body() data: { email: string; password: string },
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_login' }, data),
    );

    console.log(response);

    // Handling validation errors from microservice
    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    //Handling unsuccessful login attempts
    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Login failed',
        status: response.status || 400,
      };
      return res.json(ret);
    }

    await this.setAuthCookies(
      res,
      response.access_token,
      response.refresh_token,
    );

    return res.json({
      success: true,
      role: response.role,
      user_id: response.id,
      firstTimeLogin: response.firstTimeLogin,
    });
  }

  //first time login to change password
  @Post('first-time-login')
  async firstTimeLogin(
    @Body() data: { user_id: string; new_password: string },
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_first_time_login' }, data),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Password change failed',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
    });
  }

  //Forgot password endpoint to initiate password reset process
  @Post('forgot-password')
  async forgotPassword(@Body() data: { email: string }, @Res() res: Response) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_forgot_password' }, data),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to send password reset email',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  }

  @Post('reset-password')
  async resetPassword(
    @Body() data: { token: string; newPassword: string },
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_reset_password' }, data),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Password reset failed',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'Password reset successfully',
    });
  }

  //Refresh token endpoint to issue new access and refresh tokens
  @Get('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refresh_token = req.cookies['refresh_token'];

    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_refresh_token' }, { refresh_token }),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      if (ret.status === 403 || ret.status === 401) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return res.json(ret);
    }

    if (!response?.access_token || !response?.refresh_token) {
      return res.json({
        success: false,
        message: 'Invalid refresh response',
        status: 500,
      });
    }

    this.setAuthCookies(res, response.access_token, response.refresh_token);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      role: response.role,
      user_id: response.id,
    });
  }

  //Supporting function to set HttpOnly cookies
  private async setAuthCookies(
    res: Response,
    access_token: string,
    refresh_token: string,
  ) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
    };

    res.cookie('access_token', access_token, cookieOptions);
    res.cookie('refresh_token', refresh_token, cookieOptions);
  }

  //Bulk user registration via CSV/Excel file upload
  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file provided', 400);
    }
    const fileData = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
    };

    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'bulk_register_file' }, fileData),
    );

    // console.log(response)
    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    return res.json(response);
  }

  //get user details by id
  @Get('get-user/:userId')
  async getUser(@Param('userId') userId: string, @Res() res: Response) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_get_user' }, { userId }),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to retrieve user',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      user: response.user,
    });
  }

  @Get('users/count')
  async getUsersCount(@Res() res: Response) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_get_users_count' }, {}),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to retrieve user count',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      count: response.data,
    });
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: any, @Res() res: Response) {
    const body = req.body;
    const data = {
      ...body,
      userId: req.user.userId,
    };

    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_change_password' }, data),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message,
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: response.message,
    });
  }

  //get all users in the system
  @Get('users')
  async getUsers(@Res() res: Response) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_get_users' }, {}),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to retrieve users',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      users: response.users,
    });
  }
}
