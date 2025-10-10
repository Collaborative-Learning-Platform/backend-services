import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'update_user' })
  async updateUserName(@Payload() data: { updateUserDto: UpdateUserDto }) {
    return this.userService.updateUserName(data.updateUserDto);
  }

  
}
