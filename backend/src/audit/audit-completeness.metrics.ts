export interface AuditCompletenessMetricsPublisher {
  recordEmitted(operation: string): Promise<void>;
  recordPersisted(operation: string): Promise<void>;
}

export class InMemoryAuditCompletenessMetrics implements AuditCompletenessMetricsPublisher {
  readonly emitted = new Map<string, number>();
  readonly persisted = new Map<string, number>();

  async recordEmitted(operation: string): Promise<void> {
    this.emitted.set(operation, (this.emitted.get(operation) ?? 0) + 1);
  }

  async recordPersisted(operation: string): Promise<void> {
    this.persisted.set(operation, (this.persisted.get(operation) ?? 0) + 1);
  }
}

export class CloudWatchAuditCompletenessMetrics implements AuditCompletenessMetricsPublisher {
  async recordEmitted(operation: string): Promise<void> {
    void operation;
  }

  async recordPersisted(operation: string): Promise<void> {
    void operation;
  }
}
