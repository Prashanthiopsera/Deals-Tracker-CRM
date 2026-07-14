import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth-config';
import { sessionStore } from '@/lib/session-store';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get('p7vc_session')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  const session = await sessionStore.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const { domain, clientId, clientSecret, audience, baseUrl } = authConfig();
  const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: session.refreshToken,
      audience,
    }),
  });

  if (!tokenResponse.ok) {
    await sessionStore.revoke(sessionId);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
  }

  const tokens = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
  };

  if (tokens.refresh_token) {
    await sessionStore.updateRefreshToken(sessionId, tokens.refresh_token);
  } else {
    await sessionStore.touch(sessionId);
  }

  const response = NextResponse.json({ refreshed: true, redirect: baseUrl });
  response.headers.append(
    'Set-Cookie',
    `p7vc_access_token=${tokens.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900`,
  );
  return response;
}
