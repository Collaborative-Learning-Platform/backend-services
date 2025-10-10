import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsNumber()
  estimatedCompletionTime?: number;
}
