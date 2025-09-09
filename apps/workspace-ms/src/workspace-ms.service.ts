import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entity/workspace.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceMsService {
 constructor(@InjectRepository(Workspace) private readonly workspaceRepository: Repository<Workspace>) {}

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
        message: 'Workspace creation failed',
        error: error.message,
        status: 500,
      };
    }
  }
}
