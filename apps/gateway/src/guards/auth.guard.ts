import { Injectable,CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from 'express';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['access_token'];
    
    if (!token) {
      console.log("Token not found");
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      console.log(payload)
      request['user'] = payload; 
      return true;
    } catch {
      console.log("Token verification failed");
      return false;
    }
  }
}
