import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

export interface DigestPreferences {
  user_id: string;
  frequency: 'daily' | 'weekly' | 'disabled';
  sections: string[];
}

@Injectable()
export class EmailDigestService {
  private readonly preferences = new Map<string, DigestPreferences>();
  private readonly sent: Array<{ user_id: string; record_count: number }> = [];

  constructor(private readonly audit: AuditService) {}

  updatePreferences(userId: string, prefs: Partial<DigestPreferences>): DigestPreferences {
    const current = this.preferences.get(userId) ?? {
      user_id: userId,
      frequency: 'weekly',
      sections: ['stage_transitions', 'new_companies'],
    };
    const updated = { ...current, ...prefs, user_id: userId };
    this.preferences.set(userId, updated);
    return updated;
  }

  sendScheduledDigests(role: string): number {
    let count = 0;
    for (const prefs of this.preferences.values()) {
      if (prefs.frequency === 'disabled') continue;
      const recordCount = role === 'Intern' ? 2 : 10;
      this.sent.push({ user_id: prefs.user_id, record_count: recordCount });
      this.audit.publishAuditEvent({
        actorId: 'system',
        actorRole: 'Admin',
        operation: 'create',
        resourceType: 'Digest',
        resourceId: prefs.user_id,
        metadata: { frequency: prefs.frequency, record_count: recordCount },
      });
      count += 1;
    }
    return count;
  }

  getSentDigests() {
    return [...this.sent];
  }
}
