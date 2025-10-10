import { Controller,Inject,Get,Res, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';


@Controller('dashboard')
export class DashboardController {
    constructor(@Inject("WORKSPACE_SERVICE") private readonly WorkspaceClient: ClientProxy) {}


    //getting workspace count and group count for a user
    //need to improve API design here to send 

    // -> required data in frontend
    //   const [dashboardData, setDashboardData] = useState<{
    //     workspaces: number;
    //     groups: number;
    //     quizzes: any[];
    //     studyStreak: number;
    //     recentActivity: any[];
    //   }>({
    //     workspaces: 0,
    //     groups: 0,
    //     quizzes: [],
    //     studyStreak: 0,
    //     recentActivity: [],
    //   });

    @Get('userStats/:user_id')
    async getUserStats(@Param('user_id') userId: string, @Res() res: Response) {
        const response = await lastValueFrom(
            this.WorkspaceClient.send({ cmd: 'get_user_stats' }, { userId }),
        );

        if (response?.error) {
            const ret = handleValidationError(response.error);
            return res.json(ret);
        }

        if (!response?.success) {
            return res.json({
                success: false,
                message: response.message || 'Failed to retrieve user statistics',
                status: response.status || 400,
            });
        }

        return res.json({
            success: true,
            data: response.data,
        });
    }
}