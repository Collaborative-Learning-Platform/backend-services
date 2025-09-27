import { Body, Controller, Get, Inject, Post, Res ,Param, UseGuards, Req,UseInterceptors,UploadedFile} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';
import { AuthGuard } from '../guards/auth.guard';
import * as multer from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';


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


    @Post('/BulkAddition/:workspaceId')
    @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
    async bulkAddUsersToWorkspace(@Param('workspaceId') workspaceId: string, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
        
        // console.log('Received bulk add users to workspace request at gateway:', { workspaceId, file });

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided',
                status: 400,
            });
        }
        const fileData = {
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: file.buffer,
        };

        try{
            const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'add_users_to_workspace' }, { workspaceId, fileData }));

            if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }
            if (! response?.success) {
                return res.json({
                    success: false,
                    message: response.message || 'Failed to add users to workspace',
                    status: response.status || 400,
                });
            }
            return res.json({
                success: true,
                message: 'Users added to workspace successfully',
                data: {
                    summary: response.summary,
                    existingUsers: response.existingUsers,
                    failedUsers: response.failedUsers,
                    results: response.results,
                },
            });
        }catch (error) {
            console.error('Error occurred while sending request to microservice:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                status: 500,
            });
        }

        
    }

    @Get('getWorkspacesByUser/:user_id')
    async getWorkspaces(@Param('user_id') userId: string, @Res() res: Response) {
        console.log('Received get workspaces request at gateway:', userId);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'get_workspaces_by_user' }, { userId }));

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
    async getAllWorkspaces(@Req() req: Request, @Res() res: Response) {
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

    @Get('getWorkspace/:workspace_id')
    async getWorkspace(@Param('workspace_id') workspaceId: string, @Res() res: Response) {
        console.log('Received get workspace request at gateway:', workspaceId);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'get_workspace' }, { workspaceId }));

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }

        if (!response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to get workspace',
                status: response.status || 400,
            });
        }

        return res.json({
            success: true,
            message: 'Workspace fetched successfully',
            data: response.data,
        });
    }

    @Get ('fetchWorkspaceUsers/:workspaceId')
    async fetchWorkspaceUsers(@Param('workspaceId') workspaceId: string, @Res() res: Response) {
        console.log('Received fetch workspace users request at gateway:', workspaceId);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'get_workspace_users' }, { workspaceId }));
        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }
        if (!response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to fetch workspace users',
                status: response.status || 400,
            });
        }
        return res.json({
            success: true,
            message: 'Workspace users fetched successfully',
            data: response.data,
        });
    }





    @UseGuards(AuthGuard)
    @Post('createGroup')
    async createGroup(@Req() req: any, @Res() res: Response) {
        const body = req.body;
        const data = {
            ...body,
            userId: req.user.userId,
        };
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


    @Get('fetchGroups/:workspaceId')
    async fetchGroups(@Param('workspaceId') workspaceId: string, @Res() res: Response) {
        console.log('Received fetch groups request at gateway:', workspaceId);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'fetch_groups' }, { workspaceId }));

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

    @Post('addUserToGroup')
    async addUserToGroup(@Body() data: any, @Res() res: Response) {
        console.log('Received add user to group request at gateway:', data);
        const response = await lastValueFrom(this.WorkspaceClient.send({ cmd: 'add_user_to_group' }, data));

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }

        if (!response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to add user to group',
                status: response.status || 400,
            });
        }

        return res.json({
            success: true,
            message: 'User added to group successfully',
            data: response.data,
        });
    }



    @Post('fetchGroupsByUserInWorkspace')
    async fetchGroupsByUser(@Body() data: { userId: string, workspaceId: string }, @Res() res: Response) {
        console.log('Received fetch groups by user request at gateway:', data);
        const response = await lastValueFrom(
            this.WorkspaceClient.send({ cmd: 'get_user_groups_in_workspace' }, data),
        );

        if (response?.error) {
        const ret = handleValidationError(response.error);
        return res.json(ret);
        }

        if (!response?.success) {
        return res.json({
            success: false,
            message: response.message || 'Failed to fetch groups for user',
            status: response.status || 400,
        });
        }

        return res.json({
        success: true,
        message: 'Groups for user fetched successfully',
        data: response.data,
        });
    }
}