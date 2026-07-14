export interface SessionRecord {
  sessionId: string;
  userId: string;
  role: string;
  refreshToken: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

export interface SessionStore {
  create(record: SessionRecord): Promise<void>;
  get(sessionId: string): Promise<SessionRecord | null>;
  updateRefreshToken(sessionId: string, refreshToken: string): Promise<void>;
  touch(sessionId: string): Promise<void>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<number>;
  listForUser(userId: string): Promise<SessionRecord[]>;
}
