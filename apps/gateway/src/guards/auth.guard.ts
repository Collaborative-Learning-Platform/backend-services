import { Injectable,CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from 'express';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['auth_token'];

    if (!token) return false;

    try {
      const payload = this.jwtService.verify(token);
      request['user'] = payload; // attach user info to request
      return true;
    } catch {
      return false;
    }
  }
}
