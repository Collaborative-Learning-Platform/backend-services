import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @MessagePattern({ cmd: 'auth_login' })
  login(@Payload() data: any) {
    // In a real app, you should create and use a DTO here instead of `any`
    return this.authService.validateUser(data);
  }
}
