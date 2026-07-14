import { loginRedirect } from '@/lib/auth-config';

export async function GET() {
  return loginRedirect();
}
