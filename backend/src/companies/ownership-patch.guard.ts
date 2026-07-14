import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUserContext } from '../auth/auth.types';
import { containsOwnershipFields } from './ownership-fields';

@Injectable()
export class OwnershipPatchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUserContext;
      method?: string;
      body?: Record<string, unknown>;
    }>();

    if (request.method !== 'PATCH' && request.method !== 'PUT') {
      return true;
    }

    const body = request.body ?? {};
    if (request.user?.p7vcRole === 'Intern' && containsOwnershipFields(body)) {
      throw new ForbiddenException('You do not have permission to modify ownership fields');
    }

    if (containsOwnershipFields(body) && !['Director', 'Principal', 'Admin'].includes(request.user?.p7vcRole ?? '')) {
      throw new ForbiddenException('You do not have permission to modify ownership fields');
    }

    return true;
  }
}

export function assertNonInternOwnershipPatch(role: string, body: Record<string, unknown>): void {
  if (role === 'Intern' && containsOwnershipFields(body)) {
    throw new ForbiddenException('You do not have permission to modify ownership fields');
  }
}

export function validatePatchBody(body: Record<string, unknown>): void {
  if (Object.keys(body).length === 0) {
    throw new BadRequestException('Request body cannot be empty');
  }
}
