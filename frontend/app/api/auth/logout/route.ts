import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth-config';
import { sessionStore } from '@/lib/session-store';

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get('p7vc_session')?.value;
  const { domain, clientId, baseUrl } = authConfig();

  if (sessionId) {
    try {
      await sessionStore.revoke(sessionId);
    } catch {
      // Non-fatal — cookies are cleared below regardless
    }
  }

  const params = new URLSearchParams({
    client_id: clientId,
    returnTo: baseUrl,
  });

  const response = NextResponse.redirect(`https://${domain}/v2/logout?${params.toString()}`);
  response.headers.append('Set-Cookie', 'p7vc_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  response.headers.append('Set-Cookie', 'p7vc_access_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  return response;
}
