import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface ReportJob {
  id: string;
  status: 'queued' | 'completed' | 'failed';
  formats: string[];
  download_urls: Record<string, string>;
  error?: string;
}

@Injectable()
export class ReportGenerationService {
  private readonly jobs = new Map<string, ReportJob>();

  constructor(
    private readonly audit: AuditService,
    private readonly analytics: AnalyticsService,
  ) {}

  enqueue(input: {
    actorId: string;
    role: string;
    formats: string[];
    filters: Record<string, string | undefined>;
  }): ReportJob {
    if (!['Director', 'Principal'].includes(input.role)) {
      throw new Error('Forbidden');
    }
    const summary = this.analytics.pipelineSummary(input.filters);
    const job: ReportJob = {
      id: randomUUID(),
      status: 'queued',
      formats: input.formats,
      download_urls: {},
    };
    this.jobs.set(job.id, job);
    setTimeout(() => this.complete(job.id, summary.total), 0);
    this.audit.publishAuditEvent({
      actorId: input.actorId,
      actorRole: input.role,
      operation: 'create',
      resourceType: 'Report',
      resourceId: job.id,
      metadata: { filters: input.filters, formats: input.formats },
    });
    return job;
  }

  getJob(jobId: string): ReportJob | undefined {
    return this.jobs.get(jobId);
  }

  private complete(jobId: string, recordCount: number) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = 'completed';
    for (const format of job.formats) {
      job.download_urls[format] = `https://s3.amazonaws.com/p7vc-reports/${jobId}.${format}?records=${recordCount}`;
    }
    this.jobs.set(jobId, job);
  }
}
