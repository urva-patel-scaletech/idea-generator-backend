import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Custom parameter decorator to extract the current authenticated user from the request
 * This replaces the need for @Request() req and accessing req.user manually
 *
 * Usage: @GetCurrentUser() user: AuthenticatedUser
 */
export const GetCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
