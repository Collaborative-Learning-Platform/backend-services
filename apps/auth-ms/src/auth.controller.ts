import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from './dto/login.dto';
import { refreshTokenDTO } from './dto/refreshToken.dto';
import { ForgotPasswordDto } from './dto/ForgotPassword.dto';
import { FirstTimeLoginPasswordChangeDTO } from './dto/FirstTimeLoginPasswordChange.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth_login' })
  async login(@Payload() data: LoginDto) {
    return this.authService.login(data);
  }

  @MessagePattern({ cmd: 'auth_first_time_login' })
  async firstTimeLogin(@Payload() data: FirstTimeLoginPasswordChangeDTO) {
    return this.authService.firstTimeLogin(data.user_id, data.new_password);
  }

  @MessagePattern({ cmd: 'auth_refresh_token' })
  async refresh(@Payload() data: refreshTokenDTO) {
    return this.authService.refreshToken(data.refresh_token);
  }

  @MessagePattern({ cmd: 'auth_forgot_password' })
  async forgotPassword(@Payload() data: ForgotPasswordDto) {
    return this.authService.forgotPassword(data.email);
  }

  @MessagePattern({ cmd: 'auth_reset_password' })
  async resetPassword(@Payload() data: { token: string; newPassword: string }) {
    return this.authService.resetPassword(data.token, data.newPassword);
  }

  @MessagePattern({ cmd: 'auth_get_user' })
  async getUser(@Payload() data: { userId: string }) {
    return this.authService.getUser(data.userId);
  }

  @MessagePattern({ cmd: 'auth_get_users_count' })
  async getUserCount() {
    return this.authService.getUserCount();
  }

  @MessagePattern({ cmd: 'auth_get_users_count_with_changes' })
  async getUserCountsWithChanges() {
    return this.authService.getUserCountsWithChanges();
  }

  @MessagePattern({ cmd: 'auth_store_profile_pic_url' })
  async storeProfilePicUrl(
    @Payload() data: { userId: string; profilePicUrl: string },
  ) {
    return this.authService.storeProfilePicUrl(data.userId, data.profilePicUrl);
  }

  @MessagePattern({ cmd: 'auth_get_users' })
  async getUsers() {
    return this.authService.getUsers();
  }

  @MessagePattern({ cmd: 'get_users_by_ids' })
  async getUsersByIds(@Payload() data: { userIds: string[] }) {
    return this.authService.getUsersByIds(data.userIds);
  }

  @MessagePattern({ cmd: 'auth_change_password' })
  async changePassword(
    @Payload()
    data: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    },
  ) {
    return this.authService.changePassword(
      data.userId,
      data.currentPassword,
      data.newPassword,
    );
  }

  @MessagePattern({ cmd: 'bulk_register_file' })
  async bulkRegisterFile(fileData: { originalname: string; buffer: any }) {
    // Convert TCP-transferred buffer object to real Buffer
    let buffer: Buffer;
    if (Buffer.isBuffer(fileData.buffer)) {
      buffer = fileData.buffer;
    } else if (
      fileData.buffer?.type === 'Buffer' &&
      Array.isArray(fileData.buffer.data)
    ) {
      buffer = Buffer.from(fileData.buffer.data);
    } else {
      throw new Error('Invalid file buffer received');
    }

    return this.authService.processFileAndCreateUsers({
      originalname: fileData.originalname,
      buffer,
    });
  }

  @MessagePattern({ cmd: 'get_profile_picture_url' })
  async getProfilePictureUrl(@Payload() data: { userId: string }) {
    return this.authService.getProfilePictureUrl(data.userId);
  }
}
