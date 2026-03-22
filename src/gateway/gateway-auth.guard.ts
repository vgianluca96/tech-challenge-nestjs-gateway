import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  // Public routes that don't require authentication
  private readonly publicRoutes = [
    '/auth/register',
    '/auth/login',
    '/health',
    '/gateway/info',
  ];

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url.split('?')[0]; // Remove query parameters

    // Check if route is public
    if (this.isPublicRoute(path)) {
      return true;
    }

    // Extract JWT token from Authorization header
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      
      // Add user info to request object for downstream services
      (request as any).user = payload;
      
      // Add user info to headers for microservices
      request.headers['x-user-id'] = payload.sub;
      request.headers['x-user-email'] = payload.email;

      return true;
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      throw new UnauthorizedException('Authentication token is invalid');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isPublicRoute(path: string): boolean {
    return this.publicRoutes.some(route => {
      // Exact match for most routes
      if (route === path) {
        return true;
      }
      
      // Special handling for auth routes that might have additional path segments
      if (route === '/auth/register' && path === '/auth/register') {
        return true;
      }
      
      if (route === '/auth/login' && path === '/auth/login') {
        return true;
      }

      return false;
    });
  }
}
