import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionLifecycleService {
  private readonly sessions = new Map<string, { refreshToken: string; expiresAt: number }>();

  store(sessionId: string, refreshToken: string, ttlMs: number): void {
    this.sessions.set(sessionId, { refreshToken, expiresAt: Date.now() + ttlMs });
  }

  validate(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return !!session && session.expiresAt > Date.now();
  }

  revoke(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
