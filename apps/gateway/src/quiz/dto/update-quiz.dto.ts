import {
  IsOptional,
  IsString,
  IsUUID,
  IsDate,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQuizDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deadline?: Date;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean = false;

  @IsInt()
  @Min(0)
  @IsOptional()
  timeLimit?: number;
}
