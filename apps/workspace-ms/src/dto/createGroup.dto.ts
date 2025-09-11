import { IsString } from 'class-validator';

enum GroupType {
    MAIN = "Main",
    CUSTOM = "Custom"
}


export class createGroupDto {

  @IsString()
  name: string;

  @IsString()
  description: string;
  
  @IsString()
  type: GroupType;

  @IsString()
  workspaceId: string;

  @IsString()
  userId: string;


}
