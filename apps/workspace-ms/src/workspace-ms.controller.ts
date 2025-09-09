import { Controller, Get } from '@nestjs/common';
import { WorkspaceMsService } from './workspace-ms.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import   {workspaceCreationDto}  from './dto/workspaceCreation.dto';

@Controller()
export class WorkspaceMsController {
  constructor(private readonly workspaceMsService: WorkspaceMsService) {}

  @Get()
  getHello(): string {
    return this.workspaceMsService.getHello();
  }

  @MessagePattern({ cmd: 'create_workspace' })
  async create(@Payload() data: workspaceCreationDto){
    console.log('Received create workspace request at microservice:', data);
    return this.workspaceMsService.createWorkspace(data);
  }
}
