import { Controller, Get } from '@nestjs/common';
import { WorkspaceMsService } from './workspace-ms.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import   {workspaceCreationDto}  from './dto/workspaceCreation.dto';
import { addUserDto } from './dto/addUser.dto';
import { createGroupDto } from './dto/createGroup.dto';

@Controller()
export class WorkspaceMsController {
  constructor(private readonly workspaceMsService: WorkspaceMsService) {}

  @Get()
  getHello(): string {
    return this.workspaceMsService.getHello();
  }

  @MessagePattern({ cmd: 'create_workspace' })
  async create(@Payload() data: workspaceCreationDto){
    // console.log('Received create workspace request at microservice:', data);
    return this.workspaceMsService.createWorkspace(data);
  }

  @MessagePattern({cmd:'add_user_to_workspace'})
  async addUserToWorkspace(@Payload() data: addUserDto) {
    // console.log('Received add user to workspace request at microservice:', data);
    return this.workspaceMsService.addUserToWorkspace(data);
  }

  @MessagePattern({cmd:'get_workspaces'})
  async getWorkspaces(@Payload() data: {userId: string}) {
    console.log('Received get workspaces request at microservice:', data);
    return this.workspaceMsService.getWorkspaces(data);
  }

  @MessagePattern({cmd:'create_group'})
  async createGroup(@Payload() data: createGroupDto) {
    console.log('Received create group request at microservice:', data);
    return this.workspaceMsService.createGroup(data);
  }

  @MessagePattern({cmd:'fetch_groups'})
  async getGroups(@Payload() data: {workspaceId: string}) {
    console.log('Received get groups request at microservice:', data);
    return this.workspaceMsService.getGroups(data);
  }

}
