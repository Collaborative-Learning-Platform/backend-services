import { Controller, Post,Inject, UseGuards, Req,Res, Get, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '../guards/auth.guard';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';


@Controller('aiservice')
export class AiserviceController {
    constructor(@Inject('AI_SERVICE') private readonly aiMsService: ClientProxy) {}

    @UseGuards(AuthGuard)
    @Post('generate-study-plan')
    async generateStudyPlan(@Req() req: any, @Res() res: Response) {
        const body = req.body;
        const data ={
            ...body,
            userId: req.user.userId
        } 
        console.log('Request received at gateway', data);

        const response = await lastValueFrom(this.aiMsService.send({ cmd: 'generate_study_plan' }, data));
        console.log('Response from AI Service:', response);

        if(response?.error){
            const ret = handleValidationError(response.error);
            return res.status(400).json(ret);
        }

        if(!response.success){
            const ret = {
                success: false,
                message: response.message || 'Failed to generate study plan',
                status: response.status || 400,
            }
            return res.status(ret.status).json(ret);
        }

        

        return res.json(response);
        
    }

    @UseGuards(AuthGuard)
    @Get('getStudyPlan')
    async getStudyPlan(@Req() req: any, @Res() res: Response) {
        const userId = req.user.userId;
        ;

        const response = await lastValueFrom(this.aiMsService.send({ cmd: 'get_study_plan' }, { userId }));
        

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.status(400).json(ret);
        }

        if (!response.success) {
            const ret = {
                success: false,
                message: response.message || 'Failed to fetch study plan',
                status: response.status || 400,
            }
            return res.status(ret.status).json(ret);
        }

        return res.json(response);
    }


    @UseGuards(AuthGuard)
    @Patch('updateTaskCompletion')
    async updateTaskCompletion(@Req() req: any, @Res() res: Response) {
        const userId = req.user.userId;
        const { taskId, completed, dayName } = req.body;
        
        
        const response = await lastValueFrom(this.aiMsService.send({ cmd: 'update_task_completion' }, { userId, taskId, completed ,dayName}));
        

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return{
                success: false,
                message: ret.message || 'Failed to update task completion',
                status: ret.status || 400,
            }
        }

        if (!response.success) {
            const ret = {
                success: false,
                message: response.message || 'Failed to update task completion',
                status: response.status || 400,
            }
            return res.status(ret.status).json(ret);
        }

        return res.json(response);
    }


    @UseGuards(AuthGuard)
    @Patch('BulkUpdateTaskCompletion')
    async BulkUpdateTaskCompletion(@Req() req: any, @Res() res: Response) {
        const userId = req.user.userId;
        const { dayName, taskIds, completed ,actualStudyTime} = req.body; 

        console.log('Bulk updating task completion:', { userId, dayName, taskIds, completed ,actualStudyTime});

        const response = await lastValueFrom(this.aiMsService.send({ cmd: 'bulk_update_task_completion' }, { userId, dayName, taskIds, completed ,actualStudyTime}));
        

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return {
                success: false,
                message: ret.message || 'Failed to update task completion',
                status: ret.status || 400,
            }
        }

        if (!response.success) {
            const ret = {
                success: false,
                message: response.message || 'Failed to update task completion',
                status: response.status || 400,
            }
            return res.status(ret.status).json(ret);
        }

        return res.json(response);
    }


    @UseGuards(AuthGuard)
    @Patch('updateStudyTime')
    async updateStudyTime(@Req() req: any, @Res() res: Response) {
        const userId = req.user.userId;
        const { actualStudyTime, dayName } = req.body;
        
        const response = await lastValueFrom(this.aiMsService.send({ cmd: 'update_study_time' }, { userId, actualStudyTime, dayName }));

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return {
                success: false,
                message: ret.message || 'Failed to update study time',
                status: ret.status || 400,
            }
        }

        if (!response.success) {
            const ret = {
                success: false,
                message: response.message || 'Failed to update study time',
                status: response.status || 400,
            }
            return res.status(ret.status).json(ret);
        }

        return res.json(response);
    }
}