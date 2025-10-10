import { IsString, IsArray } from 'class-validator';

export class addUsersToGroupDto {
  @IsString()
  groupId: string;

  @IsArray()
  userIds: string[];

}
