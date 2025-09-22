import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entity/workspace.entity';
import { Repository } from 'typeorm';
import { UserWorkspace } from './entity/user-workspace.entity';
import { addUserToWorkspaceDto } from './dto/addUserToWorkspace.dto';
import { createGroupDto } from './dto/createGroup.dto';
import { Group } from './entity/group.entity';
import { UserGroup } from './entity/user-group.entity';

@Injectable()
export class WorkspaceMsService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createWorkspace(data: any) {
    console.log(data);
    try {
      const existingWorkspace = await this.workspaceRepository.findOne({
        where: { name: data.name },
      });
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
        createdAt: data.createdAt,
      });
      const response = await this.workspaceRepository.save(workspace);
      return {
        success: true,
        message: 'Workspace created successfully',
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: `Workspace creation failed: ${error.message}`,
        status: 500,
      };
    }
  }

  async addUserToWorkspace(data: addUserToWorkspaceDto) {
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

  // async getWorkspaces(data: {userId: string}) {
  //   try {
  //       const workspaces = await this.userWorkspaceRepository.find({
  //         where: { userId: data.userId },
  //         relations: ["workspace"],
  //       });

  //       const formatted = workspaces.map((ws) => ({
  //           userId: ws.userId,
  //           workspaceId: ws.workspaceId,
  //           joinedAt: ws.joinedAt.toISOString().split("T")[0],
  //           name: ws.workspace.name,
  //           description: ws.workspace.description,
  //         }));

  //         return {
  //           success: true,
  //           message: 'Workspaces retrieved successfully',
  //           data: formatted,
  //         };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `Failed to retrieve workspaces: ${error.message}`,
  //       status: 500,
  //     };
  //   }
  // }

  async getAllWorkspaces() {
    try {
      const workspaces = await this.workspaceRepository.find({
        relations: ['userWorkspaces'], // add relation in entity
      });

      const result = workspaces.map((w) => {
        const tutorCount = w.userWorkspaces.filter(
          (uw) => uw.role === 'tutor',
        ).length;
        const studentCount = w.userWorkspaces.filter(
          (uw) => uw.role === 'user',
        ).length;

        return {
          workspaceId: w.workspaceId,
          name: w.name,
          description: w.description,
          createdAt: w.createdAt,
          createdBy: w.createdBy,
          tutorCount,
          studentCount,
        };
      });

      return {
        success: true,
        message: 'All workspaces retrieved successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve workspaces: ${error.message}`,
        status: 500,
      };
    }
  }

  async getUsersWorkspaces(data: { userId: string }) {
    try {
      const userWorkspaces = await this.userWorkspaceRepository.find({
        where: { userId: data.userId },
        relations: ['workspace', 'workspace.userWorkspaces'],
      });

      const result = userWorkspaces.map((uw) => {
        const workspace = uw.workspace;

        // Count tutors and students in the workspace
        const tutorCount = workspace.userWorkspaces.filter(
          (x) => x.role === 'tutor',
        ).length;
        const studentCount = workspace.userWorkspaces.filter(
          (x) => x.role === 'user',
        ).length;

        return {
          workspaceId: workspace.workspaceId,
          name: workspace.name,
          description: workspace.description,
          createdAt: workspace.createdAt,
          createdBy: workspace.createdBy,
          tutorCount,
          studentCount,
        };
      });

      return {
        success: true,
        message: 'All workspaces retrieved successfully',
        data: result,
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
    const existingGroup = await this.groupRepository.findOne({
      where: { name: data.name, workspaceId: data.workspaceId },
    });
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

  async getGroups(data: { workspaceId: string }) {
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

  async addUserToGroup(data: { userId: string; groupId: string }) {
    try {
      const group = await this.userGroupRepository.findOne({
        where: { groupId: data.groupId },
      });
      if (!group) {
        return {
          success: false,
          message: 'Group not found',
          status: 404,
        };
      }
      const existingMembership = await this.userGroupRepository.findOne({
        where: { userId: data.userId, groupId: data.groupId },
      });
      if (existingMembership) {
        return {
          success: false,
          message: 'User is already a member of the group',
          status: 400,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to add user to group: ${error.message}`,
        status: 500,
      };
    }
    const result = await this.userGroupRepository.save({
      userId: data.userId,
      groupId: data.groupId,
    });
    return {
      success: true,
      message: 'User added to group successfully',
      data: result,
    };
  }

  async getUserStats(data: { userId: string }) {
    try {
      const workspacesCount = await this.userWorkspaceRepository.count({
        where: { userId: data.userId },
      });

      const groupsCount = await this.userGroupRepository.count({
        where: { userId: data.userId },
      });

      return {
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
          workspaces: workspacesCount,
          groups: groupsCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve user statistics: ${error.message}`,
        status: 500,
      };
    }
  }

  async getUserGroupsInWorkspace(data: {
    userId: string;
    workspaceId: string;
  }) {
    try {
      const groups = await this.groupRepository
        .createQueryBuilder('group')
        .innerJoin('user_group', 'ug', 'group.groupId = ug.groupId')
        .where('ug.userId = :userId', { userId: data.userId })
        .andWhere('group.workspaceId = :workspaceId', {
          workspaceId: data.workspaceId,
        })
        .select([
          'group.groupId',
          'group.name',
          'group.description',
          'group.type',
          'group.createdAt',
          'group.createdBy',
        ])
        .getMany();
      return {
        success: true,
        message: 'User groups in workspace retrieved successfully',
        data: groups,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve user groups in workspace: ${error.message}`,
        status: 500,
      };
    }
  }
}
