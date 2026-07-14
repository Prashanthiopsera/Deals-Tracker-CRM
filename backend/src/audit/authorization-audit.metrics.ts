import { Injectable, Logger } from '@nestjs/common';
import { AuthorizationAuditEvent } from './authorization-audit.types';

export interface AuthorizationMetricsPublisher {
  recordDecision(event: AuthorizationAuditEvent): Promise<void>;
}

@Injectable()
export class InMemoryAuthorizationMetrics implements AuthorizationMetricsPublisher {
  readonly decisions: AuthorizationAuditEvent[] = [];

  async recordDecision(event: AuthorizationAuditEvent): Promise<void> {
    this.decisions.push(event);
  }
}

@Injectable()
export class CloudWatchAuthorizationMetrics implements AuthorizationMetricsPublisher {
  private readonly logger = new Logger(CloudWatchAuthorizationMetrics.name);
  private client: import('@aws-sdk/client-cloudwatch').CloudWatchClient | null = null;

  private async getClient(): Promise<import('@aws-sdk/client-cloudwatch').CloudWatchClient | null> {
    if (process.env.AUTH_METRICS_ENABLED !== 'true') return null;
    if (!this.client) {
      const { CloudWatchClient } = await import('@aws-sdk/client-cloudwatch');
      this.client = new CloudWatchClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
    }
    return this.client;
  }

  async recordDecision(event: AuthorizationAuditEvent): Promise<void> {
    const client = await this.getClient();
    if (!client) return;

    try {
      const { PutMetricDataCommand } = await import('@aws-sdk/client-cloudwatch');
      await client.send(
        new PutMetricDataCommand({
          Namespace: 'P7VC/Authorization',
          MetricData: [
            {
              MetricName: 'AuthorizationDecision',
              Value: 1,
              Unit: 'Count',
              Timestamp: new Date(event.timestamp),
              Dimensions: [
                { Name: 'Decision', Value: event.decision },
                { Name: 'Role', Value: event.actorRole },
                { Name: 'Action', Value: event.action },
              ],
            },
          ],
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to publish authorization metric: ${String(error)}`);
    }
  }
}

@Injectable()
export class LayeredAuthorizationMetrics implements AuthorizationMetricsPublisher {
  constructor(
    private readonly memory: InMemoryAuthorizationMetrics,
    private readonly cloudwatch: CloudWatchAuthorizationMetrics,
  ) {}

  async recordDecision(event: AuthorizationAuditEvent): Promise<void> {
    await Promise.all([
      this.memory.recordDecision(event),
      this.cloudwatch.recordDecision(event),
    ]);
  }
}
