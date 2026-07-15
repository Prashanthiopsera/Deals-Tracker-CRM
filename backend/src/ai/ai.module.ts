import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { AiRetrievalAuditService } from '../audit/ai-retrieval-audit.service';
import { PiiModule } from '../pii/pii.module';
import { PiiRedactionService } from './pii-redaction.service';
import { RagModule } from '../rag/rag.module';
import { RetrievalService } from '../rag/retrieval.service';
import {
  AiAuditConsumer,
  AiAuditLogService,
  InMemoryAiAuditQueuePublisher,
} from './ai-audit-log.service';
import { ChatController } from './chat.controller';
import { ChatService, InMemoryClaudeClient } from './chat.service';
import { RedTeamEvalService } from './red-team-eval.service';

@Module({
  imports: [AuditModule, PiiModule, RagModule],
  controllers: [ChatController],
  providers: [
    InMemoryClaudeClient,
    AiRetrievalAuditService,
    InMemoryAiAuditQueuePublisher,
    AiAuditConsumer,
    RedTeamEvalService,
    {
      provide: AiAuditLogService,
      useFactory: (queue: InMemoryAiAuditQueuePublisher, consumer: AiAuditConsumer) =>
        new AiAuditLogService(queue, consumer),
      inject: [InMemoryAiAuditQueuePublisher, AiAuditConsumer],
    },
    {
      provide: ChatService,
      useFactory: (
        retrieval: RetrievalService,
        redaction: PiiRedactionService,
        claude: InMemoryClaudeClient,
        audit: AuditService,
        aiAudit: AiRetrievalAuditService,
      ) => new ChatService(retrieval, redaction, claude, audit, aiAudit),
      inject: [
        RetrievalService,
        PiiRedactionService,
        InMemoryClaudeClient,
        AuditService,
        AiRetrievalAuditService,
      ],
    },
    PiiRedactionService,
  ],
  exports: [PiiRedactionService, ChatService, AiAuditLogService, RedTeamEvalService, InMemoryClaudeClient],
})
export class AiModule {}
