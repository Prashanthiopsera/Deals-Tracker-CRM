import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../authorization/cedar.guard';

const SKIP_PREFIXES = ['/api/health', '/api/auth'];

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Invalid or missing access token');
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      user?: unknown;
      headers?: Record<string, string | string[] | undefined>;
      path?: string;
      url?: string;
    }>();
    const path = request.path ?? request.url ?? '';
    if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return true;
    }

    if (process.env.AUTH_BYPASS === 'true') {
      const roleHeader = request.headers?.['x-p7vc-test-role'];
      const userHeader = request.headers?.['x-p7vc-test-user-id'];
      const role = typeof roleHeader === 'string' ? roleHeader : 'Admin';
      const userId =
        typeof userHeader === 'string'
          ? userHeader
          : '00000000-0000-0000-0000-000000000001';
      request.user = {
        sub: `test-${userId}`,
        p7vcUserId: userId,
        p7vcRole: role,
        p7vcTeamId: 'team-red-team',
      };
      return true;
    }
    return super.canActivate(context);
  }
}
