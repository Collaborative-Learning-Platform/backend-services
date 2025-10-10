import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  groupId: string;

  @IsUUID()
  createdBy: string;
}
