import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Password comes from LAMDA_PASSWORD env var. If unset, falls back to a
 * default for local development so you're not locked out. Always set a
 * real value in production (Vercel → Settings → Environment Variables).
 */
const PASSWORD = process.env.LAMDA_PASSWORD || 'lamdaOMG!!!';

export async function POST(req: Request) {
  const { password } = await req.json();
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Incorrect' }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set('lamda_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return NextResponse.json({ ok: true });
}
