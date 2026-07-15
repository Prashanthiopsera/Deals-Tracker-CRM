import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { PiiRedactionService } from '../../ai/pii-redaction.service';
import { InMemoryClaudeClient } from '../../ai/chat.service';
import { CompaniesService } from '../../companies/companies.service';
import { AgentTaskService } from '../agent-task.service';
import { buildDealMemoPrompt, renderMemoTemplate } from './deal-memo-prompt';
import {
  sampleBedrockMemoResponse,
  sampleCompanyMemoContext,
} from '../../../test-fixtures/agent/deal-memo.fixture';

@Injectable()
export class DealMemoAgentService {
  constructor(
    private readonly tasks: AgentTaskService,
    private readonly companies: CompaniesService,
    private readonly claude: InMemoryClaudeClient,
    private readonly redaction: PiiRedactionService,
    private readonly audit: AuditService,
  ) {}

  async generateMemo(companyId: string, actorId: string, role: string) {
    const company = await this.companies.getById(companyId);
    const context = {
      company,
      notes: sampleCompanyMemoContext.notes,
      activities: sampleCompanyMemoContext.activities,
    };
    const prompt = buildDealMemoPrompt(context);

    try {
      const llm = await this.claude.invoke(prompt, JSON.stringify(context));
      const redacted = this.redaction.redactText(llm.content);
      const sections = renderMemoTemplate(redacted.content);
      const task = this.tasks.createTask({
        agent_type: 'deal_memo',
        payload: { company_id: companyId, model_id: llm.modelId },
        proposed_changes: { memo_draft: redacted.content, sections },
        acting_user_id: actorId,
      });
      this.tasks.submitForApproval(task.id, actorId);
      this.audit.publishAuditEvent({
        actorId,
        actorRole: role,
        operation: 'create',
        resourceType: 'DealMemoAgent',
        resourceId: task.id,
        metadata: {
          action: 'deal_memo.generated',
          inputTokens: llm.inputTokens,
          outputTokens: llm.outputTokens,
        },
      });
      return { task, draft: redacted.content, sections };
    } catch {
      const failed = this.tasks.createTask({
        agent_type: 'deal_memo',
        payload: { company_id: companyId, error: 'Bedrock unavailable' },
        proposed_changes: {},
        acting_user_id: actorId,
      });
      this.tasks.markFailed(failed.id, 'Bedrock unavailable');
      throw new ServiceUnavailableException('Memo generation unavailable');
    }
  }

  stubResponse() {
    return sampleBedrockMemoResponse;
  }
}
