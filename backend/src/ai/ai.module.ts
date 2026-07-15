import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { AiRetrievalAuditService } from '../audit/ai-retrieval-audit.service';
import { PiiModule } from '../pii/pii.module';
import { PiiRedactionService } from './pii-redaction.service';
import { RagModule } from '../rag/rag.module';
import { RetrievalService } from '../rag/retrieval.service';
import { ChatController } from './chat.controller';
import { ChatService, InMemoryClaudeClient } from './chat.service';

@Module({
  imports: [AuditModule, PiiModule, RagModule],
  controllers: [ChatController],
  providers: [
    InMemoryClaudeClient,
    AiRetrievalAuditService,
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
  exports: [PiiRedactionService, ChatService],
})
export class AiModule {}
