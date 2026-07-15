import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PiiModule } from '../pii/pii.module';
import { DsarController } from './dsar.controller';
import {
  DsarService,
  InMemoryDsarExportStore,
  InMemoryWorkflowTopicPublisher,
} from './dsar.service';
import { ErasureController } from './erasure.controller';
import { ErasureService, InMemoryKmsErasureClient } from './erasure.service';
import { PiiDiscoveryService } from '../pii/pii-discovery.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [AuditModule, PiiModule],
  controllers: [DsarController, ErasureController],
  providers: [
    InMemoryDsarExportStore,
    InMemoryWorkflowTopicPublisher,
    InMemoryKmsErasureClient,
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
    {
      provide: ErasureService,
      useFactory: (
        discovery: PiiDiscoveryService,
        audit: AuditService,
        kms: InMemoryKmsErasureClient,
      ) => new ErasureService(discovery, audit, kms),
      inject: [PiiDiscoveryService, AuditService, InMemoryKmsErasureClient],
    },
  ],
  exports: [DsarService, ErasureService],
})
export class ComplianceModule {}
