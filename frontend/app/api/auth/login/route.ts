import { NextRequest } from 'next/server';
import { loginRedirect } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  const connection = request.nextUrl.searchParams.get('connection') ?? undefined;
  return loginRedirect(connection);
}
