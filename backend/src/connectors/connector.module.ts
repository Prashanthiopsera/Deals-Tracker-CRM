import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import {
  ConnectorCredentialService,
  InMemorySecretsManagerClient,
} from './connector-credential.service';
import { ConnectorRegistry } from './connector.registry';
import { ActivityQueueService, ConnectorSyncStateService } from './activity/activity-capture.service';
import { DlpFilterService } from './dlp-filter.service';

@Module({
  imports: [AuditModule],
  providers: [
    ConnectorRegistry,
    InMemorySecretsManagerClient,
    ConnectorCredentialService,
    ActivityQueueService,
    ConnectorSyncStateService,
    {
      provide: DlpFilterService,
      useFactory: (audit: AuditService) => new DlpFilterService(audit),
      inject: [AuditService],
    },
  ],
  exports: [
    ConnectorRegistry,
    ConnectorCredentialService,
    InMemorySecretsManagerClient,
    ActivityQueueService,
    ConnectorSyncStateService,
    DlpFilterService,
  ],
})
export class ConnectorModule {}
