import { IsArray, ValidateNested, IsEmail, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CreatedUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;
}

export class UserBulkCreatedEventDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatedUserDto)
  users: CreatedUserDto[];
}
