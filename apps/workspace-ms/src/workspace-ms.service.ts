import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entity/workspace.entity';
import { Repository } from 'typeorm';
import { UserWorkspace } from './entity/user-workspace.entity';
import { addUserDto } from './dto/addUser.dto';
import { createGroupDto } from './dto/createGroup.dto';
import { Group } from './entity/group.entity';

@Injectable()
export class WorkspaceMsService {
 constructor(@InjectRepository(Workspace) private readonly workspaceRepository: Repository<Workspace>
  , @InjectRepository(UserWorkspace) private readonly userWorkspaceRepository: Repository<UserWorkspace>
  , @InjectRepository(Group) private readonly groupRepository: Repository<Group>) {}

  getHello(): string {
    return 'Hello World!';
  }

  
  async createWorkspace(data: any) {
    console.log(data)
    try{
      const existingWorkspace = await this.workspaceRepository.findOne({ where: { name: data.name } });
      if (existingWorkspace) {
        return {
          success: false,
          message: 'Workspace with this name already exists',
          status: 400,
        };
      }
      const workspace = this.workspaceRepository.create({
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: data.createdAt
      });
      const response = await this.workspaceRepository.save(workspace);
      return {
        success: true,
        message: 'Workspace created successfully',
        data: response,
      }

    } catch (error) {
      return {
        success: false,
        message: `Workspace creation failed: ${error.message}`,
        status: 500,
      };
    }
  }

  async addUserToWorkspace(data: addUserDto) {
    
    const userWorkspace = await this.userWorkspaceRepository.findOne({
      where: { userId: data.userId, workspaceId: data.workspaceId },
    });

    if (userWorkspace) {
      return {
        success: false,
        message: 'User is already a member of this workspace',
        status: 400,
      };
    }

    try {
      const userWorkspace = new UserWorkspace();
      userWorkspace.userId = data.userId;
      userWorkspace.workspaceId = data.workspaceId;
      const response = await this.userWorkspaceRepository.save(userWorkspace);
      return {
        success: true,
        message: 'User added to workspace successfully',
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to add user to workspace: ${error.message}`,
        status: 500,
      };
    }
  }


  async getWorkspaces(data: {userId: string}) {
    try {
        const workspaces = await this.userWorkspaceRepository.find({
          where: { userId: data.userId },
          relations: ["workspace"], 
        });

        const formatted = workspaces.map((ws) => ({
            userId: ws.userId,
            workspaceId: ws.workspaceId,
            joinedAt: ws.joinedAt.toISOString().split("T")[0],
            name: ws.workspace.name,
            description: ws.workspace.description,
          }));

          return {
            success: true,
            message: 'Workspaces retrieved successfully',
            data: formatted,
          };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve workspaces: ${error.message}`,
        status: 500,
      };
    }
  }


  async createGroup(data: createGroupDto) {
    const existingGroup = await this.groupRepository.findOne({ where: { name: data.name, workspaceId: data.workspaceId } });
    if (existingGroup) {
      return {
        success: false,
        message: 'Group with this name already exists in the workspace',
        status: 400,
      };
    }

    try {
      const group = this.groupRepository.create({
        name: data.name,
        description: data.description,
        type: data.type,
        workspaceId: data.workspaceId,
        createdBy: data.userId,
      });

      const response = await this.groupRepository.save(group);
      return {
        success: true,
        message: 'Group created successfully',
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: `Group creation failed: ${error.message}`,
        status: 500,
      };
    }
  }

  async getGroups(data: {workspaceId: string}) {
    try {
      const groups = await this.groupRepository.find({
        where: { workspaceId: data.workspaceId },
      });
      return {
        success: true,
        message: 'Groups retrieved successfully',
        data: groups,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve groups: ${error.message}`,
        status: 500,
      };
    }
  }
}  