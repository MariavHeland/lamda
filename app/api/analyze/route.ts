import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 120;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { messages, suiteEnabled } = await req.json();

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 });
  }

  const systemPrompt = buildSystemPrompt();
  const finalSystem = suiteEnabled
    ? systemPrompt.replace('LAMDA_SUITE=true', 'LAMDA_SUITE=true') // already flagged
    : systemPrompt;

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: finalSystem,
    messages,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
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
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
