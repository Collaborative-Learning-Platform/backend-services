import { Controller, Get } from '@nestjs/common';
import { WorkspaceMsService } from './workspace-ms.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import   {workspaceCreationDto}  from './dto/workspaceCreation.dto';
import { createGroupDto } from './dto/createGroup.dto';
import { addUsersToGroupDto } from './dto/addUsersToGroup.dto';


@Controller()
export class WorkspaceMsController {
  constructor(private readonly workspaceMsService: WorkspaceMsService) {}

  @Get()
  getHello(): string {
    return this.workspaceMsService.getHello();
  }

  //workspace related functions

  //creating a workspace
  @MessagePattern({ cmd: 'create_workspace' })
  async create(@Payload() data: workspaceCreationDto){
    // console.log('Received create workspace request at microservice:', data);
    return this.workspaceMsService.createWorkspace(data);
  }

  // //adding user to a workspace -> I think maybe we should change this to bulk addition
  // @MessagePattern({cmd:'add_user_to_workspace'})
  // async addUserToWorkspace(@Payload() data: addUserToWorkspaceDto) {
  //   // console.log('Received add user to workspace request at microservice:', data);
  //   return this.workspaceMsService.addUserToWorkspace(data);
  // }

  //bulk add users to a workspace
  @MessagePattern({ cmd: 'add_users_to_workspace' })
  async addUsersToWorkspace(@Payload() data: {workspaceId: string, fileData: { originalname: string; mimetype: string; buffer: any }}) {
    // console.log(data)
    const workspaceId = data.workspaceId;
    const fileData = data.fileData;
    if(!fileData || !fileData.buffer){
      return {
        success: false,
        message: "No file data or buffer provided"
      };
    }
    let buffer: Buffer;

    if(Buffer.isBuffer(fileData.buffer))
      buffer = fileData.buffer;
    else if(fileData?.buffer?.type === 'Buffer' && Array.isArray(fileData.buffer.data))
      buffer = Buffer.from(fileData.buffer.data);
    else{
      console.error("Invalid buffer format received");
      throw new Error("Invalid buffer format");
    }

    return this.workspaceMsService.addUsersToWorkspace({
      workspaceId: workspaceId,
      fileData: {
        originalname: fileData.originalname,
        mimetype: fileData.mimetype,
        buffer
      },
    });
  }



  //get workspaces for a user by user id -> user use case
  @MessagePattern({cmd:'get_workspaces_by_user'})
  async getWorkspaces(@Payload() data: {userId: string}) {
    console.log('Received get workspaces request at microservice:', data);
    return this.workspaceMsService.getUsersWorkspaces(data);
  }

  //get all workspaces in the system -> admin use case
  @MessagePattern({cmd:'get_all_workspaces'})
  async getAllWorkspaces() {
    console.log('Received get all workspaces request at microservice:');
    return this.workspaceMsService.getAllWorkspaces();
  }

  //get workspace details by id
  @MessagePattern({cmd:'get_workspace'})
  async getWorkspace(@Payload() data: {workspaceId: string}) {
    console.log('Received get workspace by id request at microservice:', data);
    return this.workspaceMsService.getWorkspaceById(data);
  }  

  //get workspace users by workspace id
  @MessagePattern({cmd:'get_workspace_users'})
  async getWorkspaceUsers(@Payload() data: {workspaceId: string}) {
    console.log('Received get workspace users request at microservice:', data);
    return this.workspaceMsService.getWorkspaceUsers(data);
  }

//===================================================================================================================================
//Group related functions



  //creating group in a workspace
  @MessagePattern({cmd:'create_group'})
  async createGroup(@Payload() data: createGroupDto) {
    console.log('Received create group request at microservice:', data);
    return this.workspaceMsService.createGroup(data);
  }

  @MessagePattern({cmd:'get_group_details'})
  async getGroupDetails(@Payload() data: {groupId: string}) {
    console.log('Received get group details request at microservice:', data);
    return this.workspaceMsService.getGroupDetails(data);
  }

  //fetching groups in a workspace
  @MessagePattern({cmd:'fetch_groups'})
  async getGroups(@Payload() data: {workspaceId: string}) {
    console.log('Received get groups request at microservice:', data);
    return this.workspaceMsService.getGroups(data);
  }

  @MessagePattern({cmd:'get_group_users'})
  async getUsers(@Payload() data: {groupId: string}) {
    console.log('Received get users in group request at microservice:', data);
    return this.workspaceMsService.getUsersInGroup(data);
  }

  //adding users to a group
  @MessagePattern({cmd:'add_users_to_group'})
  async addUsersToGroup(@Payload() data: addUsersToGroupDto) {
    console.log('Received add users to group request at microservice:', data);
    return this.workspaceMsService.addUsersToGroup(data);
  }

  //getting workspace count and group count for a user
  @MessagePattern({cmd:'get_user_stats'}) 
  async getUserStats(@Payload() data: {userId: string}) {
    console.log('Received get user stats request at microservice:', data);
    return this.workspaceMsService.getUserStats(data);
  }

  //get user joined groups inside a workspace
  @MessagePattern({cmd:'get_user_groups_in_workspace'})
  async getUserGroupsInWorkspace(@Payload() data: {userId: string, workspaceId: string}) {
    console.log('Received get user groups in workspace request at microservice:', data);
    return this.workspaceMsService.getUserGroupsInWorkspace(data);
  }
}
