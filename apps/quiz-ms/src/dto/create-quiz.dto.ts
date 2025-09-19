import { IsNotEmpty, IsString,IsUUID, IsDate, IsBoolean, IsOptional,IsInt,Min} from "class-validator";
import { Type } from 'class-transformer';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description: string;

  @IsUUID()
  @IsNotEmpty()
  groupId: string;

  @IsUUID()
  @IsNotEmpty()
  createdById: string;

  @IsDate()
  @Type(() => Date)
  deadline: Date; 

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean = false;

  @IsInt()
  @Min(0)
  timeLimit: number;
}