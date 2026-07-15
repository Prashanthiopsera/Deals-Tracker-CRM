import { Injectable, Logger } from '@nestjs/common';

export interface AnalyticsMetricSample {
  endpoint: string;
  durationMs: number;
  resultCount: number;
}

@Injectable()
export class AnalyticsMetricsService {
  private readonly logger = new Logger(AnalyticsMetricsService.name);

  recordQuery(sample: AnalyticsMetricSample): void {
    this.logger.log(
      JSON.stringify({
        metric: 'analytics.query.duration',
        namespace: 'P7VC/Analytics',
        endpoint: sample.endpoint,
        duration_ms: sample.durationMs,
        result_count: sample.resultCount,
      }),
    );
  }
}
