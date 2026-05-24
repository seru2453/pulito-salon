import { NextResponse } from 'next/server';
import {
  createAdminSessionCookie,
  isValidAdminPassword,
} from '../_auth';

export async function POST(request) {
  const payload = await request.json();
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ error: '管理パスワードが正しくありません。' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const sessionCookie = createAdminSessionCookie();
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);

  return response;
}
