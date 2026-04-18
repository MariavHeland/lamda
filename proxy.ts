import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * LAMDA auth gate.
 *
 * Everything is gated behind a password check except:
 *   - /login (the form itself)
 *   - /api/auth (the login endpoint)
 *
 * Auth state is a cookie (`lamda_auth=1`) set by /api/auth on successful login.
 * If the cookie is missing, the request is redirected to /login.
 *
 * In Next.js 16 this file convention is `proxy.ts` (formerly `middleware.ts`).
 */

const PUBLIC_PATHS = ['/login', '/api/auth'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authed = req.cookies.get('lamda_auth')?.value === '1';
  if (authed) {
    return NextResponse.next();
  }

  // For API routes, return 401 instead of redirecting
  if (pathname.startsWith('/api/')) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // For pages, redirect to /login
  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Match everything except Next.js internals and static assets
  matcher: ['/((?!_next|_vercel|favicon\\.ico|.*\\..*).*)'],
};
