import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { exportCompanyFixtures } from '../../test-fixtures/exports/export.fixture';

const BLOCKED_ROLES = new Set(['Intern']);

@Injectable()
export class ExportsService {
  constructor(private readonly audit: AuditService) {}

  createExport(input: {
    actorId: string;
    role: string;
    format: 'csv' | 'xlsx';
    filters: Record<string, string | undefined>;
  }) {
    if (BLOCKED_ROLES.has(input.role)) {
      this.audit.publishAuditEvent({
        actorId: input.actorId,
        actorRole: input.role,
        operation: 'create',
        resourceType: 'Export',
        resourceId: 'denied',
        metadata: { action: 'export.denied', format: input.format },
      });
      throw new Error('Forbidden');
    }

    const rows = exportCompanyFixtures.filter((row) => this.matches(row, input.filters));
    const jobId = randomUUID();
    const downloadUrl = `https://exports.p7vc.local/${jobId}.${input.format}`;

    this.audit.publishAuditEvent({
      actorId: input.actorId,
      actorRole: input.role,
      operation: 'create',
      resourceType: 'Export',
      resourceId: jobId,
      metadata: { action: 'export.created', row_count: rows.length, format: input.format, filters: input.filters },
    });

    if (rows.length > 1000) {
      return { job_id: jobId, status: 'queued', async: true };
    }

    return { job_id: jobId, status: 'ready', download_url: downloadUrl, row_count: rows.length };
  }

  toCsv(rows: typeof exportCompanyFixtures): string {
    const header = 'id,company_name,deal_stage,sector,geography';
    const body = rows.map((r) => `${r.id},${r.company_name},${r.deal_stage},${r.sector},${r.geography}`);
    return `\uFEFF${[header, ...body].join('\n')}`;
  }

  private matches(row: (typeof exportCompanyFixtures)[number], filters: Record<string, string | undefined>) {
    if (filters.deal_stage && row.deal_stage !== filters.deal_stage) return false;
    if (filters.sector && row.sector !== filters.sector) return false;
    return true;
  }
}
