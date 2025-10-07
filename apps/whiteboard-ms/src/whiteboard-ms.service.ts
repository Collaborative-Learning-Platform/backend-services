import { Injectable } from '@nestjs/common';

@Injectable()
export class WhiteboardMsService {
  getHello(): string {
    return 'Hello World!';
  }
}
