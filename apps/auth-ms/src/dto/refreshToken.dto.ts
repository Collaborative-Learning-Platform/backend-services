import { IsString } from "class-validator";

export class refreshTokenDTO{
    @IsString()
    refresh_token: string;

}