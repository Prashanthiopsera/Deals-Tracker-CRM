import { Module } from '@nestjs/common';
import {
  ConnectorCredentialService,
  InMemorySecretsManagerClient,
} from './connector-credential.service';
import { ConnectorRegistry } from './connector.registry';
import { ActivityQueueService, ConnectorSyncStateService } from './activity/activity-capture.service';

@Module({
  providers: [
    ConnectorRegistry,
    InMemorySecretsManagerClient,
    ConnectorCredentialService,
    ActivityQueueService,
    ConnectorSyncStateService,
  ],
  exports: [
    ConnectorRegistry,
    ConnectorCredentialService,
    InMemorySecretsManagerClient,
    ActivityQueueService,
    ConnectorSyncStateService,
  ],
})
export class ConnectorModule {}
