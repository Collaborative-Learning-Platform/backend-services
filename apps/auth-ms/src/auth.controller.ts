import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @MessagePattern({ cmd: 'auth_login' })
  login(@Payload() data: LoginDto) {
    // In a real app, you should create and use a DTO here instead of `any`
    return this.authService.validateUser(data);
  }
}
