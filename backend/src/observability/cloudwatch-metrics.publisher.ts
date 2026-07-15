import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CloudWatchMetricsPublisher {
  private readonly logger = new Logger(CloudWatchMetricsPublisher.name);

  publish(namespace: string, metric: string, value: number, dimensions: Record<string, string> = {}): void {
    this.logger.log(JSON.stringify({ namespace, metric, value, dimensions }));
  }
}
