import { Controller, Post, Body, Inject, HttpException, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Post('login')
  async login(@Body() data, @Res() res: Response) {
    try {
      // Call the auth microservice
      console.log("methanata awoooooo")
      const tokens = await lastValueFrom(
        this.authClient.send({ cmd: 'auth_login' }, data)
      );
      console.log(tokens);

      // Expected from microservice: { accessToken, refreshToken }
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: false, // true in production
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 min
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Send response to frontend
      return res.json({ message: 'Login successful' });
    } catch (error) {
      console.log(error);
      let status = error?.status;
      // If status is not a number, default to 500
      if (typeof status !== 'number' || isNaN(status)) {
        status = 500;
      }
      const message = error?.response?.message || error?.message || 'Internal server error';
      throw new HttpException(message, status);
    }
  }
}
