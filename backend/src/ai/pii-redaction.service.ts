import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PiiClassification, UserRole } from '../database/enums';
import { PiiRegistryService } from '../pii/pii-registry.service';

export const REDACTED_VALUE = '[REDACTED]';

export type RedactionAction = 'masked' | 'allowed';

export interface PiiRedactionEvent {
  fieldName: string;
  entityType: string;
  classificationTier: PiiClassification;
  redactionAction: RedactionAction;
}

export interface RedactedRagPayload {
  entityType: string;
  records: Record<string, unknown>[];
  narrative: string;
  redactionEvents: PiiRedactionEvent[];
  redactionLatencyMs: number;
}

@Injectable()
export class PiiRedactionService {
  constructor(
    private readonly piiRegistry: PiiRegistryService,
    private readonly audit: AuditService,
  ) {}

  redactRagPayload(
    payload: { entityType: string; records: Record<string, unknown>[]; narrative: string },
    actorId: string,
    actorRole: string,
  ): RedactedRagPayload {
    const started = performance.now();
    const redactionEvents: PiiRedactionEvent[] = [];
    const piiFields = this.piiRegistry.getPiiFieldsForEntity(payload.entityType);

    const records = payload.records.map((record) => {
      const redacted = { ...record };
      for (const [field, classification] of Object.entries(piiFields)) {
        if (redacted[field] === undefined || redacted[field] === null) continue;
        const action = this.resolveRedaction(actorRole, classification);
        redactionEvents.push({
          fieldName: field,
          entityType: payload.entityType,
          classificationTier: classification,
          redactionAction: action,
        });
        if (action === 'masked') {
          redacted[field] = REDACTED_VALUE;
        }
      }
      return redacted;
    });

    const narrative = this.redactNarrative(payload.narrative, actorRole, payload.entityType, redactionEvents);
    const redactionLatencyMs = performance.now() - started;

    for (const event of redactionEvents.filter((item) => item.redactionAction === 'masked')) {
      this.audit.publishAuditEvent({
        actorId,
        actorRole,
        operation: 'ai_retrieval',
        resourceType: event.entityType,
        resourceId: actorId,
        metadata: {
          action: 'ai.pii_redaction',
          field_name: event.fieldName,
          entity_type: event.entityType,
          classification_tier: event.classificationTier,
          redaction_action: event.redactionAction,
          redaction_latency_ms: redactionLatencyMs,
        },
      });
    }

    return {
      entityType: payload.entityType,
      records,
      narrative,
      redactionEvents,
      redactionLatencyMs,
    };
  }

  shouldRedactField(actorRole: string, classification: PiiClassification): boolean {
    return this.resolveRedaction(actorRole, classification) === 'masked';
  }

  redactText(text: string): { content: string } {
    let content = text;
    content = content.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, REDACTED_VALUE);
    content = content.replace(/\+?[\d][\d\-()\s]{6,}/g, REDACTED_VALUE);
    return { content };
  }

  private resolveRedaction(actorRole: string, classification: PiiClassification): RedactionAction {
    if (classification === PiiClassification.RESTRICTED && actorRole !== UserRole.ADMIN) {
      return 'masked';
    }
    if (classification === PiiClassification.CONFIDENTIAL && actorRole === UserRole.INTERN) {
      return 'masked';
    }
    return 'allowed';
  }

  private redactNarrative(
    narrative: string,
    actorRole: string,
    entityType: string,
    events: PiiRedactionEvent[],
  ): string {
    let output = narrative;
    const piiFields = this.piiRegistry.getPiiFieldsForEntity(entityType);
    for (const [field, classification] of Object.entries(piiFields)) {
      if (this.resolveRedaction(actorRole, classification) !== 'masked') continue;
      const pattern = new RegExp(this.fieldPattern(field), 'gi');
      output = output.replace(pattern, REDACTED_VALUE);
      events.push({
        fieldName: field,
        entityType,
        classificationTier: classification,
        redactionAction: 'masked',
      });
    }
    return output;
  }

  private fieldPattern(field: string): string {
    switch (field) {
      case 'email':
        return '[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}';
      case 'phone':
        return '\\+?[\\d][\\d\\-\\s()]{6,}';
      case 'firstName':
      case 'lastName':
        return '[A-Z][a-z]+';
      default:
        return '.+';
    }
  }
}
