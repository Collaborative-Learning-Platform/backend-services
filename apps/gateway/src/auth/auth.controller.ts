// apps/gateway/src/auth.controller.ts
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';


@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  @Post('login')
  async login(@Body() data) {
    console.log("first")
    try{
      return this.authClient.send({ cmd: 'auth_login' }, data);
    }
    catch(error){
      console.log(error);
    }
  }
}
