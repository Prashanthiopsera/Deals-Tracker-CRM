import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import {
  EmbeddingPipelineService,
  InMemoryBedrockEmbeddingClient,
  InMemoryEmbeddingQueueConsumer,
} from './embedding-pipeline.service';
import { EmbeddingsRegistryService } from './embeddings-registry.service';
import { RetrievalController } from './retrieval.controller';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [AuditModule],
  controllers: [RetrievalController],
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
    {
      provide: RetrievalService,
      useFactory: (
        registry: EmbeddingsRegistryService,
        bedrock: InMemoryBedrockEmbeddingClient,
        audit: AuditService,
      ) => new RetrievalService(registry, bedrock, audit),
      inject: [EmbeddingsRegistryService, InMemoryBedrockEmbeddingClient, AuditService],
    },
  ],
  exports: [EmbeddingsRegistryService, EmbeddingPipelineService, RetrievalService],
})
export class RagModule {}
