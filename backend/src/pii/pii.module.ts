import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PiiDiscoveryService } from './pii-discovery.service';
import { PiiRegistryService } from './pii-registry.service';

@Module({
  imports: [AuditModule],
  providers: [PiiRegistryService, PiiDiscoveryService],
  exports: [PiiRegistryService, PiiDiscoveryService],
})
export class PiiModule {}
