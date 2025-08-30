import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from 'express';
import * as multer from 'multer';
import { lastValueFrom } from 'rxjs';


@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Post('login')
  async login(
    @Body() data: { email: string; password: string },
    @Res() res: Response,
  ) {
    console.log('Received login request at gateway:', data);

    // Send request to Auth microservice
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_login' }, data),
    );

    console.log(response)
    // Microservice can return { error: { statusCode, message } }
    if (response?.error) {
      throw new HttpException(
        response.error.message || 'Login failed',
        response.error.statusCode || 400,
      );
    }

    if (!response?.access_token || !response?.refresh_token) {
      throw new HttpException('Invalid auth response', 500);
    }

    
    this.setAuthCookies(res, response.access_token, response.refresh_token);

    
    return res.json({
       message: 'success' ,
       role:response.role, 
       user_id:response.id
      });
  }

  @Post('refresh-token')
  async refreshToken(@Body() data: { refresh_token: string }, @Res() res: Response) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_refresh_token' }, data),
    );

    if (response?.error) {
      throw new HttpException(response.error.message || 'Refresh failed', response.error.statusCode || 401);
    }

    if (!response?.access_token || !response?.refresh_token) {
      throw new HttpException('Invalid refresh response', 500);
    }

    this.setAuthCookies(res, response.access_token, response.refresh_token);

    return res.json({
      message: 'Token refreshed successfully',
      role: response.role,
      user_id: response.id,
    });
    }



  private setAuthCookies(res: Response, access_token: string, refresh_token: string) {
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }








  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async bulkUpload(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    if (!file) {
      throw new HttpException('No file provided', 400);
    }
    const fileData = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
    };
    console.log('Received file for bulk upload:', fileData.buffer.toString('utf8'));
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'bulk_register_file' }, fileData)
    );

    if (response?.error) {
      throw new HttpException(
        response.error.message || 'Bulk Addition failed',
        response.error.statusCode || 400,
      );
    }

    return res.json(response);
  }


}
