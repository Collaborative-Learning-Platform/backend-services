import { Controller, Get } from '@nestjs/common';
import { AiMsService } from './ai-ms.service';
import { MessagePattern } from '@nestjs/microservices';
import { GenerateStudyPlanDto } from './dto/generateStudyPlanDto';
import { GenerateFlashcardsDto } from './dto/generateFlashcards.dto';
import { BulkUpdateTaskCompletionDto } from './dto/bulkUpdateTaskCompletion.dto';
import { UpdateTaskCompletionDto } from './dto/updateTaskCompletion.dto';
import { UpdateStudyTimeDto } from './dto/updateStudyTime.dto';

@Controller()
export class AiMsController {
  constructor(private readonly aiMsService: AiMsService) {}

  @MessagePattern({ cmd: 'generate_study_plan' })
  generateStudyPlan(data: GenerateStudyPlanDto) {
    return this.aiMsService.generateStudyPlan(data);
  }

  @MessagePattern({ cmd: 'get_study_plan' })
  getStudyPlan(data: { userId: string }) {
    return this.aiMsService.getStudyPlan(data.userId);
  }

  @MessagePattern({ cmd: 'update_task_completion' })
  updateTaskCompletion(data: UpdateTaskCompletionDto) {
    return this.aiMsService.updateTaskCompletion(data);
  }

  @MessagePattern({ cmd: 'bulk_update_task_completion' })
  bulkUpdateTaskCompletion(data: BulkUpdateTaskCompletionDto) {
    console.log('Bulk updating task completion:', data);
    return this.aiMsService.bulkUpdateTaskCompletion(data);
  }

  @MessagePattern({ cmd: 'update_study_time' })
  updateStudyTime(data: UpdateStudyTimeDto) {
    return this.aiMsService.updateStudyTime(data);
  }

  @MessagePattern({ cmd: 'generate_flashcards' })
  generateFlashcards(data: GenerateFlashcardsDto) {
    return this.aiMsService.generateFlashcards(data);
  }

  @MessagePattern({ cmd: 'get_flashcards_by_user' })
  getFlashcardsByUser(data: { userId: string }) {
    return this.aiMsService.getFlashcardsByUser(data.userId);
  }

  @MessagePattern({ cmd: 'get_flashcard_by_id' })
  getFlashcardById(data: { flashcardId: string; userId: string }) {
    return this.aiMsService.getFlashcardById(data.flashcardId, data.userId);
  }

  @MessagePattern({ cmd: 'delete_flashcard' })
  deleteFlashcard(data: { flashcardId: string; userId: string }) {
    return this.aiMsService.deleteFlashcard(data.flashcardId, data.userId);
  }

  @MessagePattern({ cmd: 'fetch_flashcard_stats' })
  fetchFlashcardStats(data: { userId: string }) {
    return this.aiMsService.fetchFlashcardStats(data.userId);
  }
}
