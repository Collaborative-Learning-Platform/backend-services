// login.dto.ts
import { Matches, MinLength, IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  // @MinLength(8)
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
  //   message:
  //     'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  // })
  password: string;

}
