import { Controller, Get } from '@nestjs/common';
import { WorkspaceMsService } from './workspace-ms.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import   {workspaceCreationDto}  from './dto/workspaceCreation.dto';
import { addUserToWorkspaceDto } from './dto/addUserToWorkspace.dto';
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
  async addUserToWorkspace(@Payload() data: addUserToWorkspaceDto) {
    // console.log('Received add user to workspace request at microservice:', data);
    return this.workspaceMsService.addUserToWorkspace(data);
  }

  @MessagePattern({cmd:'get_workspaces_by_user'})
  async getWorkspaces(@Payload() data: {userId: string}) {
    console.log('Received get workspaces request at microservice:', data);
    return this.workspaceMsService.getUsersWorkspaces(data);
  }

  @MessagePattern({cmd:'get_all_workspaces'})
  async getAllWorkspaces() {
    console.log('Received get all workspaces request at microservice:');
    return this.workspaceMsService.getAllWorkspaces();
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

  @MessagePattern({cmd:'add_user_to_group'})
  async addUserToGroup(@Payload() data: {userId: string, groupId: string}) {
    console.log('Received add user to group request at microservice:', data);
    return this.workspaceMsService.addUserToGroup(data);
  }

  @MessagePattern({cmd:'get_user_stats'})
  async getUserStats(@Payload() data: {userId: string}) {
    console.log('Received get user stats request at microservice:', data);
    return this.workspaceMsService.getUserStats(data);
  }
}
