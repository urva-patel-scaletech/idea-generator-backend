import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to always allow access
  canActivate(context: ExecutionContext) {
    // Always return true - don't block anonymous users
    return super.canActivate(context);
  }

  // Override handleRequest to not throw errors for missing tokens
  handleRequest(err: any, user: any): any {
    // If JWT is valid, return user
    if (user) {
      return user;
    }

    // If no JWT or invalid JWT, return null (anonymous user)
    // DON'T throw an error like the regular JwtAuthGuard does
    return null;
  }
}
