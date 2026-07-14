import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AuthUserContext } from '../auth/auth.types';
import { stripOwnershipFields, toCompanyResponse } from './ownership-fields';

@Injectable()
export class OwnershipFieldInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: AuthUserContext }>();
    const role = request.user?.p7vcRole;

    return next.handle().pipe(
      map((data) => {
        if (role !== 'Intern') {
          return this.normalizePayload(data);
        }
        return this.stripInternOwnership(data);
      }),
    );
  }

  private normalizePayload(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeCompany(item));
    }
    if (this.isRecord(data)) {
      if (Array.isArray(data.items)) {
        return { ...data, items: data.items.map((item) => this.normalizeCompany(item)) };
      }
      return this.normalizeCompany(data);
    }
    return data;
  }

  private stripInternOwnership(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.stripCompany(item));
    }
    if (this.isRecord(data)) {
      if (Array.isArray(data.items)) {
        return { ...data, items: data.items.map((item) => this.stripCompany(item)) };
      }
      return this.stripCompany(data);
    }
    return data;
  }

  private normalizeCompany(value: unknown): Record<string, unknown> {
    if (!this.isRecord(value)) return {};
    return toCompanyResponse(value);
  }

  private stripCompany(value: unknown): Record<string, unknown> {
    return stripOwnershipFields(this.normalizeCompany(value));
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
