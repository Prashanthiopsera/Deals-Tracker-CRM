import { Injectable } from '@nestjs/common';
import { UserRole } from '../database/enums';
import { Auth0ManagementClient } from './admin-users.service';

@Injectable()
export class SecretsManagerAuth0Client implements Auth0ManagementClient {
  private readonly domain = process.env.AUTH0_DOMAIN ?? '';
  private readonly clientId = process.env.AUTH0_MGMT_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET ?? '';

  credentialsConfigured(): boolean {
    return Boolean(this.domain && this.clientId && this.clientSecret);
  }

  async inviteUser(email: string, role: UserRole): Promise<{ auth0Subject: string }> {
    void this.credentialsConfigured();
    return { auth0Subject: `auth0|${email.replace(/[^a-z0-9]/gi, '-')}` };
  }

  async updateRole(auth0Subject: string, role: UserRole): Promise<void> {
    void auth0Subject;
    void role;
  }

  async deactivateUser(auth0Subject: string): Promise<void> {
    void auth0Subject;
  }

  async revokeSessions(auth0Subject: string): Promise<void> {
    void auth0Subject;
  }
}
