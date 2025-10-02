 import { IsString, IsArray, IsNumber } from 'class-validator';

export class GetUploadUrlDto {
  @IsString()
  groupId: string;

  @IsString()
  userId: string;

  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsArray()
  tags: string[];

  @IsString()
  description?: string;

  @IsNumber()
  fileSize?: number;

  @IsNumber()
  estimatedCompletionTime?: number;
}