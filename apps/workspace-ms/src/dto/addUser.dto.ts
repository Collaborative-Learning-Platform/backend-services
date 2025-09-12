import { IsString } from "class-validator";


export class addUserDto {
    @IsString()
    userId: string;

    @IsString()
    workspaceId: string;
}