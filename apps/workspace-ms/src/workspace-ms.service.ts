import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkspaceMsService {
  getHello(): string {
    return 'Hello World!';
  }
}
