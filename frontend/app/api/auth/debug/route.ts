import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const cookies = Object.fromEntries(
    request.cookies.getAll().map((c) => [c.name, c.value.slice(0, 40) + '…']),
  );
  const token = request.cookies.get('p7vc_access_token')?.value ?? '';
  let decoded: unknown = null;
  try {
    decoded = JSON.parse(
      Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
    );
  } catch (e) {
    decoded = { error: String(e) };
  }
  return NextResponse.json({ cookies, decoded });
}
