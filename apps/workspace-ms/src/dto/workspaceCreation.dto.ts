import { IsString, IsDateString } from 'class-validator';

export class workspaceCreationDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
  
  @IsDateString()
  createdAt: Date;

  @IsString()
  createdBy: string;

}
