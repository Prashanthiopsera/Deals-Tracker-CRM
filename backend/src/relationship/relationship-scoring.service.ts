import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

export interface RelationshipScore {
  id: string;
  user_id: string;
  contact_id: string;
  company_id: string;
  score: number;
  signal_breakdown: Record<string, number>;
  computed_at: string;
}

@Injectable()
export class RelationshipScoringService {
  private readonly scores: RelationshipScore[] = [];

  constructor(private readonly audit: AuditService) {}

  computeBatch(actorId: string, pairs: Array<{ user_id: string; contact_id: string; company_id: string; signals: Record<string, number> }>): RelationshipScore[] {
    const computed = pairs.map((pair) => {
      const total = Object.values(pair.signals).reduce((sum, v) => sum + v, 0);
      return {
        id: randomUUID(),
        user_id: pair.user_id,
        contact_id: pair.contact_id,
        company_id: pair.company_id,
        score: Math.min(100, total),
        signal_breakdown: pair.signals,
        computed_at: new Date().toISOString(),
      };
    });
    this.scores.push(...computed);
    this.audit.publishAuditEvent({
      actorId,
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'RelationshipScore',
      resourceId: 'batch',
      metadata: { count: computed.length },
    });
    return computed;
  }

  listByContact(contactId: string): RelationshipScore[] {
    return this.scores.filter((s) => s.contact_id === contactId).sort((a, b) => b.score - a.score);
  }
}
