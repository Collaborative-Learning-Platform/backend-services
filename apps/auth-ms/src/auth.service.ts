import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {


  validateUser(credentials:LoginDto) {
    // TODO: Logic to validate user credentials against a database
    console.log('Auth service received credentials:', credentials);

  // For now, just returning a mock response compatible with gateway expectations
  return { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };
  }
}
