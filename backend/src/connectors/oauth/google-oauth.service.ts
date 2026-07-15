import { Injectable } from '@nestjs/common';
import { ConnectorCredentialService } from '../connector-credential.service';

@Injectable()
export class GoogleOAuthService {
  private readonly tokens = new Map<string, { accessToken: string; refreshToken: string; expiresAt: number }>();

  constructor(private readonly credentials: ConnectorCredentialService) {}

  async initiate(userId: string): Promise<{ authorizationUrl: string }> {
    await this.credentials.getCredentials(`oauth/google/${userId}`);
    return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?state=${userId}` };
  }

  async handleCallback(userId: string, code: string) {
    this.tokens.set(userId, {
      accessToken: `access-${code}`,
      refreshToken: `refresh-${code}`,
      expiresAt: Date.now() + 3_600_000,
    });
    return { connected: true, userId };
  }

  async refreshIfNeeded(userId: string): Promise<string> {
    const token = this.tokens.get(userId);
    if (!token) throw new Error('Not connected');
    if (Date.now() > token.expiresAt - 300_000) {
      token.accessToken = `access-refreshed-${userId}`;
      token.expiresAt = Date.now() + 3_600_000;
    }
    return token.accessToken;
  }

  listConnections(userId: string) {
    const token = this.tokens.get(userId);
    return {
      gmail: Boolean(token),
      calendar: Boolean(token),
      tokenExpiry: token ? new Date(token.expiresAt).toISOString() : null,
      status: token ? 'healthy' : 'disconnected',
    };
  }
}
