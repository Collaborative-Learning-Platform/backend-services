import { Injectable,Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entity/workspace.entity';
import { Repository } from 'typeorm';
import { UserWorkspace } from './entity/user-workspace.entity';
import { addUserToWorkspaceDto } from './dto/addUserToWorkspace.dto';
import { createGroupDto } from './dto/createGroup.dto';
import { Group } from './entity/group.entity';
import { UserGroup } from './entity/user-group.entity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';


@Injectable()
export class WorkspaceMsService {
 constructor(
   @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
   @InjectRepository(Workspace) private readonly workspaceRepository: Repository<Workspace>,
   @InjectRepository(UserWorkspace) private readonly userWorkspaceRepository: Repository<UserWorkspace>,
   @InjectRepository(Group) private readonly groupRepository: Repository<Group>,
   @InjectRepository(UserGroup) private readonly userGroupRepository: Repository<UserGroup>
) {}

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


async addUsersToWorkspace(data: any) {
  const fileData = data.fileData;
  const workspaceId = data.workspaceId;

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
    ;
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
        this.authService.send({ cmd: 'auth_get_user' }, { userId: user.userId })
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

      successAmount++;
    } catch (error) {
      console.log(error)
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
    ? (await lastValueFrom(
        this.authService.send({ cmd: 'get_users_by_ids' }, { userIds: existingUsers })
      )).users
    : [];

  const failedUserDetails = failedUsers.length
    ? (await lastValueFrom(
        this.authService.send({ cmd: 'get_users_by_ids' }, { userIds: failedUsers })
      )).users
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
      relations: ["userWorkspaces", "groups"], 
    });

    const result = workspaces.map((w) => {
      const tutorCount = w.userWorkspaces.filter(uw => uw.role === "tutor").length;
      const studentCount = w.userWorkspaces.filter(uw => uw.role === "user").length;
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

    console.log(result)
    return {
      success: true,
      message: "All workspaces retrieved successfully",
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
      relations: ["workspace", "workspace.userWorkspaces", "workspace.groups"], 
    });

    
    const result = userWorkspaces.map((uw) => {
      const workspace = uw.workspace;

     
      const tutorCount = workspace.userWorkspaces.filter(
        (x) => x.role === "tutor"
      ).length;
      const studentCount = workspace.userWorkspaces.filter(
        (x) => x.role === "user"
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
        groupsCount
      };
    });

    return {
      success: true,
      message: "All workspaces retrieved successfully",
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
      const workspace = await this.workspaceRepository.findOne({where: { workspaceId: data.workspaceId }
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
      }
    }
  }


async getWorkspaceUsers(data: { workspaceId: string }): Promise<any> {
  try {
    // 1️⃣ Fetch workspace-user mappings
    const userWorkspaces = await this.userWorkspaceRepository.find({
      where: { workspaceId: data.workspaceId },
      // relations: ['workspace'],
    });

    const userIds = userWorkspaces.map((uw) => uw.userId);
    // console.log('User IDs:', userIds);


    const result = await lastValueFrom(this.authService.send(
      { cmd: 'get_users_by_ids' },
      { userIds }
    ));

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


    async getGroups(data: { workspaceId: string }) {
    try {
      const groups = await this.groupRepository
        .createQueryBuilder("group")
        .leftJoin("group.userGroups", "ug") 
        .where("group.workspaceId = :workspaceId", { workspaceId: data.workspaceId })
        .loadRelationCountAndMap("group.memberCount", "group.userGroups")
        .getMany();

      return {
        success: true,
        message: "Groups retrieved successfully",
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



  async addUserToGroup(data: {userId: string, groupId: string}) {
    try{
      const group = await this.userGroupRepository.findOne({ where: { groupId: data.groupId } });
      if(!group) {
        return {
          success: false,
          message: 'Group not found',
          status: 404,
        };
      }
      const existingMembership = await this.userGroupRepository.findOne({ where: { userId: data.userId, groupId: data.groupId } });
      if(existingMembership) {
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
    const result = await this.userGroupRepository.save({ userId: data.userId, groupId: data.groupId });
    return {
      success: true,
      message: 'User added to group successfully',
      data: result,
    };

    
  }





  async getUserStats(data: {userId: string}) {
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


  async getUserGroupsInWorkspace(data: {userId: string, workspaceId: string}) {
    try {
      const groups = await this.groupRepository
        .createQueryBuilder('group')
        .innerJoin('user_group', 'ug', 'group.groupId = ug.groupId')
        .where('ug.userId = :userId', { userId: data.userId })
        .andWhere('group.workspaceId = :workspaceId', { workspaceId: data.workspaceId })
        .select(['group.groupId', 'group.name', 'group.description', 'group.type', 'group.createdAt', 'group.createdBy'])
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

  
}





