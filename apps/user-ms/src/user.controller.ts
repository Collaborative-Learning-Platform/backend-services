import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPreferences } from './entity/user.entity';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'update_user' })
  async updateUserName(@Payload() data: { updateUserDto: UpdateUserDto }) {
    return this.userService.updateUserName(data.updateUserDto);
  }

  // === Create default preferences for a user ===
  @MessagePattern({ cmd: 'create_default_preferences' })
  async createDefaultPreferences(@Payload() data: { userID: string }) {
    return this.userService.createDefaultPreferences(data.userID);
  }

  // === Fetch preferences ===
  @MessagePattern({ cmd: 'get_preferences' })
  async getPreferences(@Payload() data: { userID: string }) {
    return this.userService.getPreferences(data.userID);
  }

  // === Update preferences ===
  @MessagePattern({ cmd: 'update_preferences' })
  async updatePreferences(
    @Payload() data: { userID: string; updates: Partial<UserPreferences> },
  ) {
    return this.userService.updatePreferences(data.userID, data.updates);
  }
}
