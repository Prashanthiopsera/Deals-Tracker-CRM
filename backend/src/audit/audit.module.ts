import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuditLogConsumer } from './audit-log.consumer';
import { InMemoryAuditLogRepository } from './audit-log.repository';
import {
  CloudWatchAuditCompletenessMetrics,
  InMemoryAuditCompletenessMetrics,
} from './audit-completeness.metrics';
import { AuditReconciliationService } from './audit-reconciliation.service';
import { AuditService } from './audit.service';
import { AiRetrievalAuditService } from './ai-retrieval-audit.service';
import {
  AuthorizationAuditConsumer,
  AuthorizationAuditService,
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
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    InMemoryAuditQueuePublisher,
    SqsAuditQueuePublisher,
    LayeredAuditQueuePublisher,
    InMemoryAuthorizationMetrics,
    CloudWatchAuthorizationMetrics,
    LayeredAuthorizationMetrics,
    InMemoryAuditLogRepository,
    InMemoryAuditCompletenessMetrics,
    CloudWatchAuditCompletenessMetrics,
    AiRetrievalAuditService,
    {
      provide: AuditLogConsumer,
      useFactory: (repo: InMemoryAuditLogRepository, metrics: InMemoryAuditCompletenessMetrics) =>
        new AuditLogConsumer(repo, metrics),
      inject: [InMemoryAuditLogRepository, InMemoryAuditCompletenessMetrics],
    },
    {
      provide: AuditReconciliationService,
      useFactory: (
        metrics: InMemoryAuditCompletenessMetrics,
        repo: InMemoryAuditLogRepository,
        audit: AuditService,
      ) => new AuditReconciliationService(metrics, repo, audit),
      inject: [InMemoryAuditCompletenessMetrics, InMemoryAuditLogRepository, AuditService],
    },
    {
      provide: AuthorizationAuditConsumer,
      useFactory: (repo: InMemoryAuditLogRepository) => new AuthorizationAuditConsumer(repo),
      inject: [InMemoryAuditLogRepository],
    },
    {
      provide: AuditService,
      useFactory: (
        queue: InMemoryAuditQueuePublisher,
        consumer: AuditLogConsumer,
        repo: InMemoryAuditLogRepository,
        metrics: InMemoryAuditCompletenessMetrics,
      ) => new AuditService(queue, consumer, repo, metrics),
      inject: [
        InMemoryAuditQueuePublisher,
        AuditLogConsumer,
        InMemoryAuditLogRepository,
        InMemoryAuditCompletenessMetrics,
      ],
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
  exports: [
    AuditService,
    AiRetrievalAuditService,
    AuditReconciliationService,
    AuthorizationAuditService,
    InMemoryAuditQueuePublisher,
    InMemoryAuditLogRepository,
  ],
})
export class AuditModule {}
