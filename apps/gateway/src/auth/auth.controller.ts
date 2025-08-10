// apps/gateway/src/auth.controller.ts
import { Controller, Post, Body, Inject, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';


@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Post('login')
  async login(@Body() data) {
    try {
      // Convert Observable to Promise to catch errors
      const { lastValueFrom } = await import('rxjs');
      return await lastValueFrom(this.authClient.send({ cmd: 'auth_login' }, data));
    } catch (error) {
      // Forward the error from the microservice, or default to 500
      console.log(error)
      const status = error?.status || 500;
      const message = error?.response?.message || error?.message || 'Internal server error';
      throw new HttpException(message, status);
    }
  }
}
