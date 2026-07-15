import { Module } from '@nestjs/common';
import {
  ConnectorCredentialService,
  InMemorySecretsManagerClient,
} from './connector-credential.service';
import { ConnectorRegistry } from './connector.registry';

@Module({
  providers: [ConnectorRegistry, InMemorySecretsManagerClient, ConnectorCredentialService],
  exports: [ConnectorRegistry, ConnectorCredentialService, InMemorySecretsManagerClient],
})
export class ConnectorModule {}
