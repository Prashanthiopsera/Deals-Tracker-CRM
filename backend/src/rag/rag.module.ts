import { Module } from '@nestjs/common';
import {
  EmbeddingPipelineService,
  InMemoryBedrockEmbeddingClient,
  InMemoryEmbeddingQueueConsumer,
} from './embedding-pipeline.service';
import { EmbeddingsRegistryService } from './embeddings-registry.service';

@Module({
  providers: [
    EmbeddingsRegistryService,
    InMemoryBedrockEmbeddingClient,
    InMemoryEmbeddingQueueConsumer,
    {
      provide: EmbeddingPipelineService,
      useFactory: (
        registry: EmbeddingsRegistryService,
        bedrock: InMemoryBedrockEmbeddingClient,
        queue: InMemoryEmbeddingQueueConsumer,
      ) => new EmbeddingPipelineService(registry, bedrock, queue),
      inject: [EmbeddingsRegistryService, InMemoryBedrockEmbeddingClient, InMemoryEmbeddingQueueConsumer],
    },
  ],
  exports: [EmbeddingsRegistryService, EmbeddingPipelineService],
})
export class RagModule {}
