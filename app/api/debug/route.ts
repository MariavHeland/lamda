export const runtime = 'nodejs';

/**
 * /api/debug — environment sanity check.
 *
 * Only enabled when NODE_ENV !== 'production'. In production this returns 404
 * to avoid leaking any information about the server's environment.
 *
 * Even in dev, we only report WHETHER the key is set and its length — never
 * any part of the key itself.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  return Response.json({
    env: process.env.NODE_ENV,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    keyLen: process.env.ANTHROPIC_API_KEY?.length ?? 0,
    suiteEnabled: process.env.LAMDA_SUITE === 'true',
    mindaUrl: process.env.MINDA_API_URL ?? '(not set, will use localhost:3002)',
    guidaUrl: process.env.GUIDA_API_URL ?? '(not set, will use localhost:3000)',
  });
}
