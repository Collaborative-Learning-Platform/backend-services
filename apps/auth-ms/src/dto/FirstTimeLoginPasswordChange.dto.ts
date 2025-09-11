// login.dto.ts
import { IsString, MinLength,Matches } from 'class-validator';

export class FirstTimeLoginPasswordChangeDTO {
  @IsString()
  user_id: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  new_password: string;
}
