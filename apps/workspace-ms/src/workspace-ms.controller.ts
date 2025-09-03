import { Controller, Get } from '@nestjs/common';
import { WorkspaceMsService } from './workspace-ms.service';

@Controller()
export class WorkspaceMsController {
  constructor(private readonly workspaceMsService: WorkspaceMsService) {}

  @Get()
  getHello(): string {
    return this.workspaceMsService.getHello();
  }
}
