import { IsString } from "class-validator";


enum Role {
    TUTOR = "Tutor",
    USER = "User",
}

export class addUserToWorkspaceDto {
    @IsString()
    userId: string;

    @IsString()
    workspaceId: string;

    @IsString()
    role: Role;
}