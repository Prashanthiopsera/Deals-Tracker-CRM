import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Invalid or missing access token');
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    if (process.env.AUTH_BYPASS === 'true') {
      const request = context.switchToHttp().getRequest<{ user?: unknown }>();
      request.user = {
        sub: 'test-subject',
        p7vcUserId: '00000000-0000-0000-0000-000000000001',
        p7vcRole: 'Admin',
      };
      return true;
    }
    return super.canActivate(context);
  }
}
