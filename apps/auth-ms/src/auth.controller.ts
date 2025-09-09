import { Controller} from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from './dto/login.dto';
import { refreshTokenDTO } from './dto/refreshToken.dto';
import { PasswordResetDto } from './dto/passwordReset.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth_login' })
  async login(@Payload() data: LoginDto) {
    
    return this.authService.validateUser(data);
  }


  @MessagePattern({ cmd: 'auth_refresh_token' })
  async refresh(@Payload() data: refreshTokenDTO) {
    return this.authService.refreshToken(data.refresh_token);
  }

  @MessagePattern({ cmd: 'auth_forgot_password' })
  async forgotPassword(@Payload() data: PasswordResetDto) {
    return this.authService.forgotPassword(data.email);
  }




  @MessagePattern({ cmd: 'bulk_register_file' })
  async bulkRegisterFile(fileData: { originalname: string; buffer: any }) {


    // Convert TCP-transferred buffer object to real Buffer
    let buffer: Buffer;
    if (Buffer.isBuffer(fileData.buffer)) {
      buffer = fileData.buffer;
    } else if (fileData.buffer?.type === 'Buffer' && Array.isArray(fileData.buffer.data)) {
      buffer = Buffer.from(fileData.buffer.data);
    } else {
      throw new Error('Invalid file buffer received');
    }

    // console.log('File buffer size (bytes):', buffer.length);

    
    return this.authService.processFileAndCreateUsers({
      originalname: fileData.originalname,
      buffer,
    });
  }

}
