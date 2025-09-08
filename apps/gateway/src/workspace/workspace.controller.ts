import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
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
        // console.log(response)

        // if (response?.error) {
        //     const ret = {
        //         success: false,
        //         message: response.error.message || 'Workspace creation failed',
        //         status: response.error.statusCode || 400,
        //     }
        //     return res.json(ret);
        // }   
        if (response?.error) {
          const ret = handleValidationError(response.error);
          return res.json(ret);
        }

        return res.json(response);
    }
}
