import {
  CallHandler,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuthUserContext } from '../auth/auth.types';
import {
  assertAuthorized,
  buildAuthRequest,
  CedarAuthorizationService,
} from './cedar.service';
import { CedarAction } from './cedar.types';

export const CEDAR_ACTION_KEY = 'cedar_action';
export const CEDAR_RESOURCE_KEY = 'cedar_resource';

export const CedarAuthorize = (action: CedarAction, resourceType = 'Company') =>
  SetMetadata(CEDAR_ACTION_KEY, { action, resourceType });

@Injectable()
export class CedarGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly cedar: CedarAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<{ action: CedarAction; resourceType: string }>(
      CEDAR_ACTION_KEY,
      context.getHandler(),
    );
    if (!meta) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUserContext; params?: { id?: string } }>();
    const user = request.user;
    if (!user) return false;

    const decision = await this.cedar.authorize(
      buildAuthRequest(user, meta.action, meta.resourceType, request.params?.id),
    );
    assertAuthorized(decision);
    return true;
  }
}

@Injectable()
export class CedarInterceptor {
  constructor(private readonly cedar: CedarAuthorizationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle();
  }
}
