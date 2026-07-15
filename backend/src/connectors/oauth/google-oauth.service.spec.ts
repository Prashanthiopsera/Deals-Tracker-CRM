import { ConnectorCredentialService, InMemorySecretsManagerClient } from '../connector-credential.service';
import { GoogleOAuthService } from './google-oauth.service';

describe('GoogleOAuthService (WO-103)', () => {
  const credentials = new ConnectorCredentialService(new InMemorySecretsManagerClient());
  const oauth = new GoogleOAuthService(credentials);

  it('initiates OAuth with PKCE-ready authorization URL', async () => {
    const result = await oauth.initiate('director-1');
    expect(result.authorizationUrl).toContain('accounts.google.com');
  });

  it('refreshes tokens before expiry buffer', async () => {
    await oauth.handleCallback('director-1', 'code-1');
    const token = await oauth.refreshIfNeeded('director-1');
    expect(token).toContain('access-');
  });
});
