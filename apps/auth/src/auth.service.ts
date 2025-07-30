import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getHello(): string {
    return 'Hello World!';
  }

  validateUser(credentials: any) {
    // TODO: Logic to validate user credentials against a database
    console.log('Auth service received credentials:', credentials);

    // For now, just returning a mock response.
    return { token: 'a-very-real-jwt-token' };
  }
}
