import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuditLogConsumer } from './audit-log.consumer';
import { InMemoryAuditLogRepository } from './audit-log.repository';
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
    AuditLogConsumer,
    AiRetrievalAuditService,
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
      ) => new AuditService(queue, consumer, repo),
      inject: [InMemoryAuditQueuePublisher, AuditLogConsumer, InMemoryAuditLogRepository],
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
    AuthorizationAuditService,
    InMemoryAuditQueuePublisher,
    InMemoryAuditLogRepository,
  ],
})
export class AuditModule {}
