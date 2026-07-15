import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PiiModule } from '../pii/pii.module';
import { DsarController } from './dsar.controller';
import {
  DsarService,
  InMemoryDsarExportStore,
  InMemoryWorkflowTopicPublisher,
} from './dsar.service';
import { PiiDiscoveryService } from '../pii/pii-discovery.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [AuditModule, PiiModule],
  controllers: [DsarController],
  providers: [
    InMemoryDsarExportStore,
    InMemoryWorkflowTopicPublisher,
    {
      provide: DsarService,
      useFactory: (
        discovery: PiiDiscoveryService,
        audit: AuditService,
        exportStore: InMemoryDsarExportStore,
        workflowTopic: InMemoryWorkflowTopicPublisher,
      ) => new DsarService(discovery, audit, exportStore, workflowTopic),
      inject: [
        PiiDiscoveryService,
        AuditService,
        InMemoryDsarExportStore,
        InMemoryWorkflowTopicPublisher,
      ],
    },
  ],
  exports: [DsarService],
})
export class ComplianceModule {}
