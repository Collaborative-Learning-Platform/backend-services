import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateTaskCompletionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsBoolean()
  completed: boolean;

  @IsString()
  @IsNotEmpty()
  dayName: string;
}