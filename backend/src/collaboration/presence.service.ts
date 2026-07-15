import { Injectable } from '@nestjs/common';

export interface PresenceSession {
  user_id: string;
  company_id: string;
  last_seen_at: string;
}

@Injectable()
export class PresenceService {
  private readonly sessions = new Map<string, PresenceSession>();

  heartbeat(userId: string, companyId: string): PresenceSession {
    const key = `${userId}:${companyId}`;
    const session: PresenceSession = {
      user_id: userId,
      company_id: companyId,
      last_seen_at: new Date().toISOString(),
    };
    this.sessions.set(key, session);
    return session;
  }

  listViewers(companyId: string, maxAgeMs = 30_000): string[] {
    const cutoff = Date.now() - maxAgeMs;
    return [...this.sessions.values()]
      .filter(
        (session) =>
          session.company_id === companyId && Date.parse(session.last_seen_at) >= cutoff,
      )
      .map((session) => session.user_id);
  }

  leave(userId: string, companyId: string): void {
    this.sessions.delete(`${userId}:${companyId}`);
  }
}
