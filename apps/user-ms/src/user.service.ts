import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  getHello(): string {
    return 'Hello World!';
  }

  getProfile() {
    
    return { name: 'John Doe', age: 30, email: 'john@example.com' };
  }
}
