import { Body, Controller, Get, Inject, Post, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';


@Controller('workspace')
export class WorkspaceController {

    constructor(@Inject('WORKSPACE_SERVICE') private readonly WorkspaceClient: ClientProxy) {}



    @Post('create')
    async createWorkspace(@Body() data: any, @Res() res: Response) {
        console.log('Received create workspace request at gateway:', data);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'create_workspace' }, data));
 
        if (response?.error) {
          const ret = handleValidationError(response.error);
          return res.json(ret);
        }

        return res.json(response);
    }

    @Post('addUser')
    async addUserToWorkspace(@Body() data: any, @Res() res: Response) {
        console.log('Received add user to workspace request at gateway:', data);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'add_user_to_workspace' }, data));

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }


        if (! response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to add user to workspace',
                status: response.status || 400,
            });
        }


        return res.json({
            success: true,
            message: 'User added to workspace successfully',
            data: response.data,
        })
        
    }

    @Post('getWorkspacesByUser')
    async getWorkspaces(@Body() data: any, @Res() res: Response) {
        console.log('Received get workspaces request at gateway:', data);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'get_workspaces' }, data));

        if (response?.error) {
            console.log('Validation error:', response.error);
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }

        if (! response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to get workspaces',
                status: response.status || 400,
            });
        }

        return res.json({
            success: true,
            message: 'Workspaces fetched successfully',
            data: response.data,
        })
    }

    @Get('getAllWorkspaces')
    async getAllWorkspaces( @Res() res: Response) {
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'get_all_workspaces' }, {}));

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }
        if (! response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to get all workspaces',
                status: response.status || 400,
            });
        }
        return res.json({
            success: true,
            message: 'All workspaces fetched successfully',
            data: response.data,
        })
    }

    @Post('createGroup')
    async createGroup(@Body() data: any, @Res() res: Response) {
        console.log('Received create group request at gateway:', data);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'create_group' }, data));

        console.log(response);
        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }

        if (!response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to create group',
                status: response.status || 400,
            });
        }

        return res.json({
            success: true,
            message: 'Group created successfully',
            data: response.data,
        });

    }

    @Post('fetchGroups')
    async fetchGroups(@Body() data: any, @Res() res: Response) {
        console.log('Received fetch groups request at gateway:', data);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'fetch_groups' }, data));

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }

        if (!response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to fetch groups',
                status: response.status || 400,
            });
        }

        return res.json({
            success: true,
            message: 'Groups fetched successfully',
            data: response.data,
        });
    }
  }