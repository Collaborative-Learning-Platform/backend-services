import { IsEmail, IsNotEmpty } from "class-validator";

export class MailDataDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  html: string;
}
