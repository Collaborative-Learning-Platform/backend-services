import { Controller, Get } from '@nestjs/common';
import { AiMsService } from './ai-ms.service';
import { MessagePattern } from '@nestjs/microservices';
import { GenerateStudyPlanDto } from './dto/generateStudyPlanDto';

@Controller()
export class AiMsController {
  constructor(private readonly aiMsService: AiMsService) {}

  @MessagePattern({cmd:'generate_study_plan'})
  generateStudyPlan(data: GenerateStudyPlanDto) {
    return this.aiMsService.generateStudyPlan(data);
  }
}