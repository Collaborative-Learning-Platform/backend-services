import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationMsService {
  getHello(): string {
    return 'Hello World!';
  }
}
