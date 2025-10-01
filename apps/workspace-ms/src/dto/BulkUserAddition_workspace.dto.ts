import { IsString } from 'class-validator';


class FileDataDto {
  @IsString()
  originalname: string;

  @IsString()
  mimetype: string;

  buffer: any; 
}

export class BulkAdditionDto {
  @IsString()
  workspaceId: string;


  fileData: FileDataDto;
}
