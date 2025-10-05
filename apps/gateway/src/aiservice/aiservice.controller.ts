import { Controller, Post,Inject, UseGuards, Req,Res } from '@nestjs/common';
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

}


