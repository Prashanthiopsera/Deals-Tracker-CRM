import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUserContext } from '../auth/auth.types';
import { deriveCedarAction, deriveResourceType } from './cedar-action-mapper';
import {
  assertAuthorized,
  buildAuthRequest,
  CedarAuthorizationService,
} from './cedar.service';
import { CedarAction } from './cedar.types';

export const CEDAR_ACTION_KEY = 'cedar_action';
export const IS_PUBLIC_KEY = 'is_public';

export const CedarAuthorize = (action: CedarAction, resourceType = 'Company') =>
  SetMetadata(CEDAR_ACTION_KEY, { action, resourceType });

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

const SKIP_PREFIXES = ['/api/health', '/api/auth'];

@Injectable()
export class CedarGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cedar: CedarAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      user?: AuthUserContext;
      method?: string;
      path?: string;
      url?: string;
      route?: { path?: string };
      params?: { id?: string };
    }>();

    const path = request.route?.path ?? request.path ?? request.url ?? '';
    if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return true;
    }

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const meta = this.reflector.get<{ action: CedarAction; resourceType: string }>(
      CEDAR_ACTION_KEY,
      context.getHandler(),
    );

    const action = meta?.action ?? deriveCedarAction(request.method ?? 'GET', path);
    const resourceType = meta?.resourceType ?? deriveResourceType(path);

    const decision = await this.cedar.authorize(
      buildAuthRequest(user, action, resourceType, request.params?.id),
    );
    assertAuthorized(decision);
    return true;
  }
}
