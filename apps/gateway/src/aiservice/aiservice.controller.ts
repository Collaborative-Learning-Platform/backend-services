import {
  Controller,
  Post,
  Inject,
  UseGuards,
  Req,
  Res,
  Get,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '../guards/auth.guard';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';

@Controller('aiservice')
export class AiserviceController {
  constructor(
    @Inject('AI_SERVICE') private readonly aiMsService: ClientProxy,
  ) {}

  @UseGuards(AuthGuard)
  @Post('generate-study-plan')
  async generateStudyPlan(@Req() req: any, @Res() res: Response) {
    const body = req.body;
    const data = {
      ...body,
      userId: req.user.userId,
    };
    console.log('Request received at gateway', data);

    const response = await lastValueFrom(
      this.aiMsService.send({ cmd: 'generate_study_plan' }, data),
    );
    console.log('Response from AI Service:', response);

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.status(400).json(ret);
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to generate study plan',
        status: response.status || 400,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Get('getStudyPlan')
  async getStudyPlan(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const response = await lastValueFrom(
      this.aiMsService.send({ cmd: 'get_study_plan' }, { userId }),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.status(400).json(ret);
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to fetch study plan',
        status: response.status || 400,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Patch('updateTaskCompletion')
  async updateTaskCompletion(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const { taskId, completed, dayName } = req.body;

    const response = await lastValueFrom(
      this.aiMsService.send(
        { cmd: 'update_task_completion' },
        { userId, taskId, completed, dayName },
      ),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return {
        success: false,
        message: ret.message || 'Failed to update task completion',
        status: ret.status || 400,
      };
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to update task completion',
        status: response.status || 400,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Patch('BulkUpdateTaskCompletion')
  async BulkUpdateTaskCompletion(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const { dayName, taskIds, completed, actualStudyTime } = req.body;

    console.log('Bulk updating task completion:', {
      userId,
      dayName,
      taskIds,
      completed,
      actualStudyTime,
    });

    const response = await lastValueFrom(
      this.aiMsService.send(
        { cmd: 'bulk_update_task_completion' },
        { userId, dayName, taskIds, completed, actualStudyTime },
      ),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return {
        success: false,
        message: ret.message || 'Failed to update task completion',
        status: ret.status || 400,
      };
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to update task completion',
        status: response.status || 400,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Patch('updateStudyTime')
  async updateStudyTime(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const { actualStudyTime, dayName } = req.body;

    const response = await lastValueFrom(
      this.aiMsService.send(
        { cmd: 'update_study_time' },
        { userId, actualStudyTime, dayName },
      ),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return {
        success: false,
        message: ret.message || 'Failed to update study time',
        status: ret.status || 400,
      };
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to update study time',
        status: response.status || 400,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Post('generate-flashcards')
  async generateFlashcards(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const { resourceId, fileName, contentType, description, number } = req.body;

    const data = {
      userId,
      resourceId,
      fileName,
      contentType,
      description,
      number,
    };

    console.log('Request received at gateway for flashcard generation:', data);

    const response = await lastValueFrom(
      this.aiMsService.send({ cmd: 'generate_flashcards' }, data),
    );

    console.log('Response from AI Service for flashcards:', response);

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.status(400).json(ret);
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to generate flashcards',
        status: response.status || 400,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Get('flashcards')
  async getFlashcardsByUser(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;

    console.log(
      'Request received at gateway to get flashcards for user:',
      userId,
    );

    const response = await lastValueFrom(
      this.aiMsService.send({ cmd: 'get_flashcards_by_user' }, { userId }),
    );

    console.log('Response from AI Service for get flashcards:', response);

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.status(400).json(ret);
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to retrieve flashcards',
        status: response.status || 400,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Get('flashcards/:flashcardId')
  async getFlashcardById(
    @Req() req: any,
    @Res() res: Response,
    @Param('flashcardId') flashcardId: string,
  ) {
    const userId = req.user.userId;

    console.log('Request received at gateway to get flashcard:', {
      flashcardId,
      userId,
    });

    const response = await lastValueFrom(
      this.aiMsService.send(
        { cmd: 'get_flashcard_by_id' },
        { flashcardId, userId },
      ),
    );

    console.log('Response from AI Service for get flashcard by id:', response);

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.status(400).json(ret);
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to retrieve flashcard',
        status: response.status || 404,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }

  @UseGuards(AuthGuard)
  @Delete('flashcards/:flashcardId')
  async deleteFlashcard(
    @Req() req: any,
    @Res() res: Response,
    @Param('flashcardId') flashcardId: string,
  ) {
    const userId = req.user.userId;

    console.log('Request received at gateway to delete flashcard:', {
      flashcardId,
      userId,
    });

    const response = await lastValueFrom(
      this.aiMsService.send(
        { cmd: 'delete_flashcard' },
        { flashcardId, userId },
      ),
    );

    console.log('Response from AI Service for delete flashcard:', response);

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.status(400).json(ret);
    }

    if (!response.success) {
      const ret = {
        success: false,
        message: response.message || 'Failed to delete flashcard',
        status: response.status || 404,
      };
      return res.status(ret.status).json(ret);
    }

    return res.json(response);
  }
}
