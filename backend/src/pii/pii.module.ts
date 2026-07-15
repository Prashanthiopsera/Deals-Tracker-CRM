import { Module } from '@nestjs/common';
import { PiiRegistryService } from './pii-registry.service';

@Module({
  providers: [PiiRegistryService],
  exports: [PiiRegistryService],
})
export class PiiModule {}
