import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, type LamdaRole } from '@/lib/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 120;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, suiteEnabled, role } = await req.json();

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 });
    }

    const systemPrompt = buildSystemPrompt(role as LamdaRole | undefined);

    const finalSystem = suiteEnabled
      ? systemPrompt + '\n\nLAMDA_SUITE=true — append the SUITE HANDOFF block at the end of every analysis.'
      : systemPrompt;

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            system: finalSystem,
            messages,
          });

          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error('[analyze] stream error:', err);
          controller.error(err);
        }
      },
      cancel() {
        // client disconnected — nothing to clean up (SDK handles it)
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[analyze] handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
