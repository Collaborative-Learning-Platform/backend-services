import { Injectable,CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from 'express';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('========= AUTH GUARD CALLED =========');
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['access_token'];
    
    console.log('Auth Guard - Token from cookie:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log("Auth Guard - No access token found in cookies");
      return false;
    }

    try {
      console.log('Auth Guard - JWT_SECRET:', process.env.JWT_SECRET);
      console.log('Auth Guard - Token to verify:', token);
      const payload = this.jwtService.verify(token);
      console.log('Auth Guard - Token verified successfully, payload:', payload);
      request['user'] = payload; 
      return true;
    } catch (error) {
      console.log("Auth Guard - Token verification failed:", error.message);
      console.log("Auth Guard - Error details:", error);
      return false;
    }
  }
}
