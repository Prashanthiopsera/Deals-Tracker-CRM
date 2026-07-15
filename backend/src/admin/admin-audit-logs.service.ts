import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuditLogRepository } from '../audit/audit-log.repository';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AdminAuditLogSearchQueryDto } from './admin-audit-logs.dto';

@Injectable()
export class AdminAuditLogsService {
  constructor(
    private readonly repository: AuditLogRepository,
    private readonly audit: AuditService,
  ) {}

  async search(query: AdminAuditLogSearchQueryDto, actor: { id: string; role: string }) {
    if (actor.role !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);
    const rows = await this.repository.query({
      actorId: query.actorId,
      operation: query.operationType,
      resourceType: query.entityType,
      resourceId: query.entityId,
      from: query.dateFrom ? new Date(query.dateFrom) : undefined,
      to: query.dateTo ? new Date(query.dateTo) : undefined,
    });

    const sorted = [...rows].sort((a, b) => {
      const direction = query.sortOrder === 'ASC' ? 1 : -1;
      const left = a.timestamp?.getTime() ?? 0;
      const right = b.timestamp?.getTime() ?? 0;
      return (left - right) * direction;
    });

    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize).map((entry) => this.toResponse(entry));
    const total = sorted.length;
    const totalPages = Math.ceil(total / pageSize) || 1;

    this.audit.publishAuditEvent({
      actorId: actor.id,
      actorRole: actor.role,
      operation: 'update',
      resourceType: 'AuditLog',
      resourceId: '00000000-0000-0000-0000-000000000000',
      metadata: {
        search_type: 'audit_log_search',
        filters: query,
        result_count: items.length,
      },
    });

    return { items, total, page, pageSize, totalPages };
  }

  async exportCsv(query: AdminAuditLogSearchQueryDto, actor: { id: string; role: string }): Promise<string> {
    const result = await this.search({ ...query, page: 1, pageSize: 200 }, actor);
    const header = [
      'id',
      'actorId',
      'actorRole',
      'operationType',
      'entityType',
      'entityId',
      'createdAt',
      'correlationId',
    ];
    const lines = [header.join(',')];
    for (const item of result.items.slice(0, 10_000)) {
      lines.push(
        [
          item.id,
          item.actorId,
          item.actorRole,
          item.operationType,
          item.entityType,
          item.entityId,
          item.createdAt,
          item.correlationId,
        ]
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      );
    }
    return lines.join('\n');
  }

  private toResponse(entry: Partial<AuditLog>) {
    return {
      id: entry.id,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      operationType: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      changedFields: entry.changedFields,
      metadata: entry.metadata,
      createdAt: entry.timestamp,
      correlationId: entry.metadata?.correlation_id ?? null,
    };
  }
}
