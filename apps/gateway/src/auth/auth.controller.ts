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
import { handleValidationError } from '../utils/validationErrorHandler';


@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  
  @Post('login')
  async login(
    @Body() data: { email: string; password: string },
    @Res() res: Response,
  ) {
    console.log('Received login request at gateway:', data);

    
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'auth_login' }, data),
    );

    console.log(response)

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
      }
      return res.json(ret);
    }

    this.setAuthCookies(res, response.access_token, response.refresh_token);

    
    return res.json({
       success: true,
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
      const ret = handleValidationError(response.error);
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
    
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'bulk_register_file' }, fileData)
    );

    // console.log(response)
    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }



    return res.json(response);
  }


}


