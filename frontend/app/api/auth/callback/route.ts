import { NextRequest, NextResponse } from 'next/server';
import { authConfig, createSessionCookie, newSessionId } from '@/lib/auth-config';
import { storeRefreshToken } from '@/lib/redis-session';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const { domain, clientId, clientSecret, audience, baseUrl } = authConfig();
  const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${baseUrl}/api/auth/callback`,
      audience,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 401 });
  }

  const tokens = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
  };

  const sessionId = newSessionId();
  if (tokens.refresh_token) {
    await storeRefreshToken(sessionId, tokens.refresh_token);
  }

  const response = NextResponse.redirect(`${baseUrl}/`);
  response.headers.append('Set-Cookie', createSessionCookie(sessionId));
  response.headers.append(
    'Set-Cookie',
    `p7vc_access_token=${tokens.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900`,
  );
  return response;
}
