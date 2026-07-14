import { Module } from '@nestjs/common';
import {
  AuthorizationAuditConsumer,
  AuthorizationAuditService,
  InMemoryAuditLogRepository,
} from './authorization-audit.service';
import {
  CloudWatchAuthorizationMetrics,
  InMemoryAuthorizationMetrics,
  LayeredAuthorizationMetrics,
} from './authorization-audit.metrics';
import {
  InMemoryAuditQueuePublisher,
  LayeredAuditQueuePublisher,
  SqsAuditQueuePublisher,
} from './authorization-audit.publisher';

@Module({
  providers: [
    InMemoryAuditQueuePublisher,
    SqsAuditQueuePublisher,
    LayeredAuditQueuePublisher,
    InMemoryAuthorizationMetrics,
    CloudWatchAuthorizationMetrics,
    LayeredAuthorizationMetrics,
    InMemoryAuditLogRepository,
    {
      provide: AuthorizationAuditConsumer,
      useFactory: (repo: InMemoryAuditLogRepository) => new AuthorizationAuditConsumer(repo),
      inject: [InMemoryAuditLogRepository],
    },
    {
      provide: AuthorizationAuditService,
      useFactory: (
        publisher: LayeredAuditQueuePublisher,
        consumer: AuthorizationAuditConsumer,
        metrics: LayeredAuthorizationMetrics,
      ) => new AuthorizationAuditService(publisher, consumer, metrics),
      inject: [LayeredAuditQueuePublisher, AuthorizationAuditConsumer, LayeredAuthorizationMetrics],
    },
  ],
  exports: [AuthorizationAuditService, InMemoryAuditQueuePublisher, InMemoryAuditLogRepository],
})
export class AuditModule {}
