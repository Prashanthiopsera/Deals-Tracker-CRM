import { Module } from '@nestjs/common';
import { EmbeddingsRegistryService } from './embeddings-registry.service';

@Module({
  providers: [EmbeddingsRegistryService],
  exports: [EmbeddingsRegistryService],
})
export class RagModule {}
