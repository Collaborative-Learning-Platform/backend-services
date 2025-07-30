import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getHello(): string {
    return this.userService.getHello();
  }

  @MessagePattern({ cmd: 'get_profile' })
  getProfile() {
    // In a real app, you should create and use a DTO here instead of `any`
    return this.userService.getProfile();
  }  
}
