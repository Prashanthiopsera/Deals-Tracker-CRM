import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('p7vc_access_token')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = JSON.parse(
    Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
  ) as Record<string, string>;

  return NextResponse.json({
    authenticated: true,
    user: {
      sub: payload.sub,
      p7vcRole: payload.p7vc_role,
      p7vcUserId: payload.p7vc_user_id,
      p7vcTeamId: payload.p7vc_team_id,
    },
  });
}
