import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entity/workspace.entity';
import { Repository, DataSource, MoreThan, LessThan } from 'typeorm';
import { UserWorkspace } from './entity/user-workspace.entity';
import { createGroupDto } from './dto/createGroup.dto';
import { Group } from './entity/group.entity';
import { UserGroup } from './entity/user-group.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import { addUsersToGroupDto } from './dto/addUsersToGroup.dto';

@Injectable()
export class WorkspaceMsService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    @Inject('STORAGE_SERVICE') private readonly storageService: ClientProxy,
    @Inject('QUIZ_SERVICE') private readonly quizService: ClientProxy,
    @Inject('DOCUMENT_SERVICE') private readonly documentService: ClientProxy,
    @Inject('CHAT_SERVICE') private readonly chatService: ClientProxy,
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    private readonly dataSource: DataSource,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  //workspace related functions

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

      //MessagePattern to analytics-ms to log the created workspace endpoint
      await lastValueFrom(
        this.analyticsClient.send(
          { cmd: 'log_user_activity' },
          {
            user_id: response.createdBy,
            category: 'GENERAL',
            activity_type: 'CREATED_WORKSPACE',
            metadata: {
              workspaceId: response.workspaceId,
              workspaceName: response.name,
              createdAt: response.createdAt,
            },
          },
        ),
      );
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

  // async addUserToWorkspace(data: addUserToWorkspaceDto) {

  //   const userWorkspace = await this.userWorkspaceRepository.findOne({
  //     where: { userId: data.userId, workspaceId: data.workspaceId },
  //   });

  //   if (userWorkspace) {
  //     return {
  //       success: false,
  //       message: 'User is already a member of this workspace',
  //       status: 400,
  //     };
  //   }

  //   try {
  //     const userWorkspace = new UserWorkspace();
  //     userWorkspace.userId = data.userId;
  //     userWorkspace.workspaceId = data.workspaceId;
  //     const response = await this.userWorkspaceRepository.save(userWorkspace);
  //     return {
  //       success: true,
  //       message: 'User added to workspace successfully',
  //       data: response,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: `Failed to add user to workspace: ${error.message}`,
  //       status: 500,
  //     };
  //   }
  // }

  async addUsersToWorkspace(data: any) {
    const fileData = data.fileData;
    const workspaceId = data.workspaceId;

    //Get the workspaceInformation
    const WorkspaceData = await this.getWorkspaceById({ workspaceId });

    // Ensure WorkspaceData.data is defined before logging
    if (!WorkspaceData.data) {
      throw new Error(
        'Workspace data is undefined. Cannot log addition of users to workspace.',
      );
    }

    const failedUsers: string[] = [];
    const existingUsers: string[] = [];
    let successAmount = 0;
    let totalAmount = 0;

    const TempResults: {
      userId: string;
      success: boolean;
      message: string;
      role?: string;
      joinedAt?: Date;
      name?: string;
      email?: string;
    }[] = [];

    let userDetails: any[] = [];

    try {
      // Try parsing as Excel first
      userDetails = this.parseExcel(fileData.buffer);
    } catch (err) {
      // Fallback to CSV
      userDetails = await this.parseCsv(fileData.buffer);
    }

    totalAmount = userDetails.length;

    for (const user of userDetails) {
      const userWorkspace = await this.userWorkspaceRepository.findOne({
        where: { userId: user.userId, workspaceId },
      });

      if (userWorkspace) {
        existingUsers.push(user.userId);
        TempResults.push({
          userId: user.userId,
          role: user.role,
          success: false,
          message: 'User is already a member of this workspace',
        });
        continue;
      }

      try {
        const newUserWorkspace = this.userWorkspaceRepository.create({
          userId: user.userId,
          workspaceId,
          role: user.role,
        });
        await this.userWorkspaceRepository.save(newUserWorkspace);

        const userInfo = await lastValueFrom(
          this.authService.send(
            { cmd: 'auth_get_user' },
            { userId: user.userId },
          ),
        );

        if (userInfo.success) {
          name: userInfo.user.name;
          email: userInfo.user.email;
        }

        TempResults.push({
          name: userInfo.user.name,
          email: userInfo.user.email,
          userId: user.userId,
          role: user.role,
          success: true,
          joinedAt: newUserWorkspace.joinedAt,
          message: 'User added to workspace successfully',
        });

        //Log the Addition of the user to the workspace only if the addition is successful
        await lastValueFrom(
          this.analyticsClient.send(
            { cmd: 'log_user_activity' },
            {
              user_id: user.userId,
              category: 'GENERAL',
              activity_type: 'ADDED_TO_WORKSPACE',
              metadata: {
                workspaceId: WorkspaceData.data.workspaceId,
                name: WorkspaceData.data.name,
                createdBy: WorkspaceData.data.createdBy,
              },
            },
          ),
        );

        successAmount++;
      } catch (error) {
        console.log(error);
        failedUsers.push(user.userId);
        TempResults.push({
          userId: user.userId,
          role: user.role,
          success: false,
          message: `Failed to add user: ${error.message}`,
        });
      }
    }

    // Fetch full user details for existing and failed users
    const existingUserDetails = existingUsers.length
      ? (
          await lastValueFrom(
            this.authService.send(
              { cmd: 'get_users_by_ids' },
              { userIds: existingUsers },
            ),
          )
        ).users
      : [];

    const failedUserDetails = failedUsers.length
      ? (
          await lastValueFrom(
            this.authService.send(
              { cmd: 'get_users_by_ids' },
              { userIds: failedUsers },
            ),
          )
        ).users
      : [];

    return {
      success: true,
      message: 'Bulk user addition completed',
      summary: {
        total: totalAmount,
        added: successAmount,
        existing: existingUsers.length,
        failed: failedUsers.length,
      },
      existingUsers: existingUserDetails,
      failedUsers: failedUserDetails,
      results: TempResults, //per user result
    };
  }

  async getAllWorkspaces() {
    try {
      const workspaces = await this.workspaceRepository.find({
        relations: ['userWorkspaces', 'groups'],
      });

      const result = workspaces.map((w) => {
        const tutorCount = w.userWorkspaces.filter(
          (uw) => uw.role === 'tutor',
        ).length;
        const studentCount = w.userWorkspaces.filter(
          (uw) => uw.role === 'user',
        ).length;
        const groupsCount = w.groups ? w.groups.length : 0;

        return {
          workspaceId: w.workspaceId,
          name: w.name,
          description: w.description,
          createdAt: w.createdAt,
          createdBy: w.createdBy,
          tutorCount,
          studentCount,
          groupsCount,
        };
      });

      console.log(result);
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
        relations: [
          'workspace',
          'workspace.userWorkspaces',
          'workspace.groups',
        ],
      });

      const result = userWorkspaces.map((uw) => {
        const workspace = uw.workspace;

        const tutorCount = workspace.userWorkspaces.filter(
          (x) => x.role === 'tutor',
        ).length;
        const studentCount = workspace.userWorkspaces.filter(
          (x) => x.role === 'user',
        ).length;

        const groupsCount = workspace.groups ? workspace.groups.length : 0;

        return {
          workspaceId: workspace.workspaceId,
          name: workspace.name,
          description: workspace.description,
          createdAt: workspace.createdAt,
          createdBy: workspace.createdBy,
          tutorCount,
          studentCount,
          groupsCount,
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

  async getWorkspaceById(data: { workspaceId: string }) {
    try {
      const workspace = await this.workspaceRepository.findOne({
        where: { workspaceId: data.workspaceId },
      });
      if (!workspace) {
        return {
          success: false,
          message: 'Workspace not found',
          status: 404,
        };
      }
      return {
        success: true,
        message: 'Workspace retrieved successfully',
        data: workspace,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve workspace: ${error.message}`,
        status: 500,
      };
    }
  }

  async getWorkspaceUsers(data: { workspaceId: string }): Promise<any> {
    try {
      //  Fetch workspace-user mappings
      const userWorkspaces = await this.userWorkspaceRepository.find({
        where: { workspaceId: data.workspaceId },
      });

      const userIds = userWorkspaces.map((uw) => uw.userId);

      const result = await lastValueFrom(
        this.authService.send({ cmd: 'get_users_by_ids' }, { userIds }),
      );

      if (!result.success) {
        return {
          success: false,
          message: 'Failed to fetch user details from Auth Service',
          status: 500,
        };
      }

      const filteredUsers = result.users.map((u: any) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
      }));

      const enriched = userWorkspaces.map((uw) => ({
        ...uw,
        user: filteredUsers.find((u) => u.userId === uw.userId),
      }));

      return {
        success: true,
        message: 'Workspace users retrieved successfully',
        data: enriched,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve workspace users: ${error.message}`,
        status: 500,
      };
    }
  }

  //====================================================================================================================================
  //group related functions
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

      // Log the group creation in the analytics service only if group creation is successful
      await lastValueFrom(
        this.analyticsClient.send(
          { cmd: 'log_user_activity' },
          {
            user_id: data.userId,
            category: 'GENERAL',
            activity_type: 'CREATED_GROUP',
            metadata: {
              groupId: response.groupId,
              workspaceId: response.workspaceId,
              name: response.name,
              type: response.type,
            },
          },
        ),
      );
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

  async createCustomGroup(data: createGroupDto) {
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

      const savedGroup = await this.groupRepository.save(group);

      // Log the group creation in the analytics service only if the group creation is successful
      await lastValueFrom(
        this.analyticsClient.send(
          { cmd: 'log_user_activity' },
          {
            user_id: data.userId,
            category: 'GENERAL',
            activity_type: 'CREATED_GROUP',
            metadata: {
              groupId: savedGroup.groupId,
              workspaceId: savedGroup.workspaceId,
              name: savedGroup.name,
              type: savedGroup.type,
            },
          },
        ),
      );

      const userGroup = this.userGroupRepository.create({
        userId: data.userId,
        groupId: savedGroup.groupId,
      });

      this.addUsersToGroup({
        groupId: savedGroup.groupId,
        userIds: [data.userId],
      });

      await this.userGroupRepository.save(userGroup);

      return {
        success: true,
        message: 'Custom group created successfully',
        data: savedGroup,
      };
    } catch (error) {
      return {
        success: false,
        message: `Custom group creation failed: ${error.message}`,
        status: 500,
      };
    }
  }

  async getGroupDetails(data: { groupId: string }): Promise<any> {
    try {
      const group = await this.groupRepository.findOne({
        where: { groupId: data.groupId },
      });

      if (!group) {
        return {
          success: false,
          message: 'Group not found',
          status: 404,
        };
      }

      const userGroups = await this.userGroupRepository.find({
        where: { groupId: data.groupId },
      });

      const usersIds = userGroups.map((ug) => ug.userId);
      const memberCount = usersIds.length;
      const users = await lastValueFrom(
        this.authService.send(
          { cmd: 'get_users_by_ids' },
          { userIds: usersIds },
        ),
      );

      const detailedGroup = { ...group, memberCount, members: users.users };

      return {
        success: true,
        message: 'Group details retrieved successfully',
        data: detailedGroup,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve group details: ${error.message}`,
        status: 500,
      };
    }
  }

  async getGroups(data: { workspaceId: string }) {
    try {
      const groups = await this.groupRepository
        .createQueryBuilder('group')
        .leftJoin('group.userGroups', 'ug')
        .where('group.workspaceId = :workspaceId', {
          workspaceId: data.workspaceId,
        })
        .loadRelationCountAndMap('group.memberCount', 'group.userGroups')
        .getMany();

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

  async getUsersInGroup(data: { groupId: string }) {
    try {
      const userGroups = await this.userGroupRepository.find({
        where: { groupId: data.groupId },
      });
      const userIds = userGroups.map((ug) => ug.userId);
      const result = await lastValueFrom(
        this.authService.send({ cmd: 'get_users_by_ids' }, { userIds }),
      );
      if (!result.success) {
        return {
          success: false,
          message: 'Failed to fetch user details from Auth Service',
          status: 500,
        };
      }
      return {
        success: true,
        message: 'Group users retrieved successfully',
        data: result.users,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve group users: ${error.message}`,
        status: 500,
      };
    }
  }

  async addUsersToGroup(data: addUsersToGroupDto) {
    //front end only sends non existing users to be added
    const groupId = data.groupId;
    const userIds = data.userIds;
    const failedUsers: string[] = [];

    //Get group data to log the addition of the group to log the group
    const GroupData = await this.getGroupDetails({ groupId });

    // Ensure GroupData.data is defined before logging
    if (!GroupData.data) {
      throw new Error('Group data is undefined. Cannot add users to group.');
    }

    const TempResults: {
      userId: string;
      success: boolean;
      message: string;
    }[] = [];

    let successAmount = 0;

    for (const userId of userIds) {
      try {
        const userGroup = this.userGroupRepository.create({
          userId,
          groupId,
        });
        await this.userGroupRepository.save(userGroup);
        successAmount++;
        TempResults.push({
          userId,
          success: true,
          message: 'User added to group successfully',
        });

        //Log the addition of the user to the group by sending message to Analytics
        await lastValueFrom(
          this.analyticsClient.send(
            { cmd: 'log_user_activity' },
            {
              user_id: userId,
              category: 'GENERAL',
              activity_type: 'ADDED_TO_GROUP',
              metadata: {
                groupId: GroupData.data.groupId,
                workspaceId: GroupData.workspaceId,
                name: GroupData.data.name,
                type: GroupData.data.type,
              },
            },
          ),
        );
      } catch (error) {
        failedUsers.push(userId);
        TempResults.push({
          userId,
          success: false,
          message: `Failed to add user to group: ${error.message}`,
        });
      }
    }

    return {
      success: true,
      message: 'Users added to group successfully',
      data: {
        AddedUsers: userIds.filter((id) => !failedUsers.includes(id)),
        TempResults,
        successAmount,
      },
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
        .innerJoin('group.userGroups', 'ug') // relation join
        .where('ug.userId = :userId', { userId: data.userId })
        .andWhere('group.workspaceId = :workspaceId', {
          workspaceId: data.workspaceId,
        })
        .leftJoin('group.userGroups', 'allUsers') // join again to count members
        .select([
          'group.groupId',
          'group.name',
          'group.description',
          'group.type',
          'group.createdAt',
          'group.createdBy',
        ])
        .addSelect('COUNT(allUsers.userId)', 'memberCount')
        .groupBy('group.groupId')
        .getRawMany(); // <-- use getRawMany to access memberCount

      // map into clean objects
      const formatted = groups.map((g) => ({
        groupId: g.group_groupId,
        name: g.group_name,
        description: g.group_description,
        type: g.group_type,
        createdAt: g.group_createdAt,
        createdBy: g.group_createdBy,
        memberCount: parseInt(g.memberCount, 10),
      }));

      return {
        success: true,
        message: 'User groups in workspace retrieved successfully',
        data: formatted,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve user groups in workspace: ${error.message}`,
        status: 500,
      };
    }
  }

  //Function for getting all the groups and all the workspaces the user is in
  async getUserWorkspacesWithGroups(data: { userId: string }) {
    //  Get all the workspaces the user is in
    try {
      const userWorkspaces = await this.userWorkspaceRepository.find({
        where: { userId: data.userId },
        relations: [
          'workspace',
          'workspace.groups',
          'workspace.groups.userGroups',
        ],
      });

      if (!userWorkspaces.length) {
        return {
          success: true,
          message: 'No workspaces found for user',
          data: [],
        };
      }

      const workspaceInfo = userWorkspaces.map((uw) => {
        const workspace = uw.workspace;

        //Get the groups in those workspaces that the user is in
        const groups = workspace.groups
          .filter((g) => g.userGroups.some((ug) => ug.userId === data.userId))
          .map((g) => ({
            groupId: g.groupId,
            name: g.name,
          }));

        return {
          workspaceId: workspace.workspaceId,
          name: workspace.name,
          groups,
        };
      });

      return {
        success: true,
        message: 'All workspaces retrieved successfully',
        data: workspaceInfo,
      };
    } catch (error) {
      console.error('Failed to fetch workspaces with groups', error);
      return {
        success: false,
        message: 'Failed to retrieve workspaces and groups',
        status: 500,
      };
    }
  }

  async getGroupsByUser(data: { userId: string }) {
    try {
      const userGroups = await this.userGroupRepository.find({
        where: { userId: data.userId },
        relations: ['group', 'group.workspace'],
      });
      if (!userGroups.length) {
        return {
          success: true,
          message: 'No groups found for user',
          data: [],
        };
      }
      const groupInfo = userGroups.map((ug) => {
        const group = ug.group;
        const workspace = group.workspace;
        return {
          groupId: group.groupId,
          groupName: group.name,
          groupDescription: group.description,
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.name,
        };
      });
      return {
        success: true,
        message: 'User groups retrieved successfully',
        data: groupInfo,
      };
    } catch (error) {
      console.error('Failed to fetch user groups', error);
      return {
        success: false,
        message: 'Failed to retrieve user groups',
        status: 500,
      };
    }
  }

  async deleteGroup(data: { groupId: string; userId: string }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const group = await queryRunner.manager.findOne(Group, {
        where: { groupId: data.groupId },
      });

      if (!group) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: 'Group not found',
          status: 404,
        };
      }

      // Delete the group (cascade will remove user-groups)
      await queryRunner.manager.remove(group);

      // Delete related entities in other microservices
      const quizDeleteResponse = await this.deleteGroupQuizzes({
        groupId: data.groupId,
      });
      const documentDeleteResponse = await this.deleteGroupDocuments({
        groupId: data.groupId,
      });
      const chatDeleteResponse = await this.deleteGroupChats({
        groupId: data.groupId,
      });
      const storageDeleteResponse = await this.deleteGroupStorage({
        groupId: data.groupId,
      });

      if (
        !quizDeleteResponse.success ||
        !documentDeleteResponse.success ||
        !chatDeleteResponse.success ||
        !storageDeleteResponse.success
      ) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          message: 'Failed to delete related entities',
          status: 500,
        };
      }

      // Commit the transaction if all operations succeed
      await queryRunner.commitTransaction();

      // Log the deletion of the group only if the transaction is commited
      await lastValueFrom(
        this.analyticsClient.send(
          { cmd: 'log_user_activity' },
          {
            user_id: data.userId,
            category: 'GENERAL',
            activity_type: 'DELETED_GROUP',
            metadata: {
              groupId: group.groupId,
              name: group.name,
              type: group.type,
              workspaceId: group.workspaceId,
              deletedBy: data.userId,
            },
          },
        ),
      );

      return {
        success: true,
        message: 'Group deleted successfully',
      };
    } catch (error) {
      // Rollback the transaction on any error
      await queryRunner.rollbackTransaction();
      console.error('Failed to delete group', error);
      return {
        success: false,
        message: 'Failed to delete group',
        status: 500,
      };
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  //supportive functions for group deletion (interservice communication to delete related entities)
  //no need to delete user-groups as they are cascade deleted with group deletion

  async deleteGroupQuizzes(data: { groupId: string }) {
    try {
      const response = await lastValueFrom(
        this.quizService.send(
          { cmd: 'delete_group_quizzes' },
          { groupId: data.groupId },
        ),
      );
      return response;
    } catch (error) {
      console.error('Failed to delete group quizzes', error);
      return { success: false, message: 'Failed to delete group quizzes' };
    }
  }

  async deleteGroupDocuments(data: { groupId: string }) {
    try {
      const response = await lastValueFrom(
        this.documentService.send(
          { cmd: 'delete_group_documents' },
          data.groupId,
        ),
      );
      return response;
    } catch (error) {
      console.error('Failed to delete group documents', error);
      return { success: false, message: 'Failed to delete group documents' };
    }
  }

  async deleteGroupChats(data: { groupId: string }) {
    try {
      const response = await lastValueFrom(
        this.chatService.send({ cmd: 'delete_group_chat' }, data.groupId),
      );
      return response;
    } catch (error) {
      console.error('Failed to delete group chats', error);
      return { success: false, message: 'Failed to delete group chats' };
    }
  }

  async deleteGroupStorage(data: { groupId: string }) {
    try {
      const response = await lastValueFrom(
        this.storageService.send(
          { cmd: 'clear_group_storage' },
          { groupId: data.groupId },
        ),
      );
      return response;
    } catch (error) {
      console.error('Failed to delete group storage', error);
      return { success: false, message: 'Failed to delete group storage' };
    }
  }

  //supportive functions for bulk user addition
  private parseCsv(fileBuffer: Buffer): Promise<any[]> {
    const results: any[] = [];

    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error('Expected fileBuffer to be a Buffer');
    }

    const stream = new Readable();
    stream.push(fileBuffer.toString('utf-8')); // convert Buffer to string for CSV parser
    stream.push(null);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private parseExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }

  //Get the total Number of Workspaces and Groups
  // Returns the total number of workspaces and groups
  async getWorkspaceAndGroupCount(): Promise<{
    success: boolean;
    workspaces?: number;
    groups?: number;
    message?: string;
  }> {
    try {
      const [workspaceCount, groupCount] = await Promise.all([
        this.workspaceRepository.count(),
        this.groupRepository.count(),
      ]);
      return { success: true, workspaces: workspaceCount, groups: groupCount };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get counts: ${error.message}`,
      };
    }
  }

  //Get workspace and group counts with week-over-week changes
  async getWorkspaceAndGroupCountWithChanges(): Promise<{
    success: boolean;
    workspaces?: number;
    groups?: number;
    workspaceCountChange?: number;
    groupCountChange?: number;
    workspacePercentChange?: number;
    groupPercentChange?: number;
    lastWeekCounts?: {
      workspaces: number;
      groups: number;
    };
    message?: string;
  }> {
    try {
      // Get current date boundaries
      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - 7); // 7 days ago
      startOfThisWeek.setHours(0, 0, 0, 0);

      // Current counts
      const [workspaceCount, groupCount] = await Promise.all([
        this.workspaceRepository.count(),
        this.groupRepository.count(),
      ]);

      // Last week counts (entities created before a week ago)
      const [workspaceCountLastWeek, groupCountLastWeek] = await Promise.all([
        this.workspaceRepository.count({
          where: {
            createdAt: LessThan(startOfThisWeek),
          },
        }),
        this.groupRepository.count({
          where: {
            createdAt: LessThan(startOfThisWeek),
          },
        }),
      ]);

      // Calculate changes
      const workspaceCountChange = workspaceCount - workspaceCountLastWeek;
      const groupCountChange = groupCount - groupCountLastWeek;

      // Calculate percentage changes
      const workspacePercentChange =
        workspaceCountLastWeek > 0
          ? (workspaceCountChange / workspaceCountLastWeek) * 100
          : workspaceCountChange > 0
            ? 100
            : 0;

      const groupPercentChange =
        groupCountLastWeek > 0
          ? (groupCountChange / groupCountLastWeek) * 100
          : groupCountChange > 0
            ? 100
            : 0;

      return {
        success: true,
        workspaces: workspaceCount,
        groups: groupCount,
        workspaceCountChange,
        groupCountChange,
        workspacePercentChange: Number(workspacePercentChange.toFixed(2)),
        groupPercentChange: Number(groupPercentChange.toFixed(2)),
        lastWeekCounts: {
          workspaces: workspaceCountLastWeek,
          groups: groupCountLastWeek,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get counts with changes: ${error.message}`,
      };
    }
  }
}
