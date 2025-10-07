import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to check if user's email is verified
 * Apply to routes that require email verification
 *
 * Usage:
 * @UseGuards(EmailVerifiedGuard)
 * async protectedRoute() { ... }
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email address to access this resource. Check your inbox for the verification link.'
      );
    }

    return true;
  }
}
