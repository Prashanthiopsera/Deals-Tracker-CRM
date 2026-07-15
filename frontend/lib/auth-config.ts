import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export function authConfig() {
  return {
    domain: process.env.AUTH0_DOMAIN ?? 'p7vc.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID ?? '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET ?? '',
    audience: process.env.AUTH0_AUDIENCE ?? 'https://api.p7vc-crm.com',
    baseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3001',
  };
}

export function loginRedirect() {
  const { domain, clientId, audience, baseUrl } = authConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: `${baseUrl}/api/auth/callback`,
    scope: 'openid profile email offline_access',
    audience,
  });
  return NextResponse.redirect(`https://${domain}/authorize?${params.toString()}`);
}

export function createSessionCookie(sessionId: string) {
  return `p7vc_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function newSessionId(): string {
  return randomUUID();
}
