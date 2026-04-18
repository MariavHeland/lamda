/**
 * POST /api/suite-handoff
 *
 * Called by the LAMDA chat UI after a completed analysis when Suite mode is on.
 * Parses the SUITE HANDOFF block from the assistant response and dispatches it
 * to the other DA SUITE apps:
 *
 *   → MINDA   — logs the session as a project memory note
 *   → GUIDA   — sends the development context for financing strategy awareness
 *
 * Body: { analysis: string, userInput: string, role: string, projectId?: string }
 *
 * Returns: { sent: string[], errors: string[] }
 */

export const runtime = 'nodejs';

const MINDA_API  = process.env.MINDA_API_URL  || 'http://localhost:3002/api';
const GUIDA_API  = process.env.GUIDA_API_URL  || 'http://localhost:3000/api';
const INTER_SECRET = process.env.INTER_SERVICE_SECRET || 'lamda-suite-dev-secret';

/** Extract the SUITE HANDOFF section from the analysis text */
function extractHandoff(text: string): string | null {
  const marker = /## SUITE HANDOFF/i;
  const idx = text.search(marker);
  if (idx === -1) return null;
  return text.slice(idx).trim();
}

/** Parse key fields out of the handoff block for structured delivery */
function parseHandoff(handoff: string): {
  guidaContext?: string;
  aydaParameters?: string;
  mindaNote?: string;
} {
  const section = (label: string): string | undefined => {
    const re = new RegExp(`(?:###?\\s*${label}[:\\s]*)([\\s\\S]*?)(?=###?\\s|$)`, 'i');
    const m = handoff.match(re);
    return m?.[1]?.trim() || undefined;
  };

  return {
    guidaContext:   section('GUIDA') || section('FINANCING') || section('FINANCING CHECK'),
    aydaParameters: section('AYDA') || section('BUDGET'),
    mindaNote:      section('MINDA') || section('MEMORY'),
  };
}

async function sendToMinda(payload: {
  analysis:   string;
  handoff:    string;
  userInput:  string;
  role:       string;
  projectId?: string;
  parsed:     ReturnType<typeof parseHandoff>;
}): Promise<void> {
  const body = JSON.stringify({
    source:    'LAMDA',
    eventType: 'LAMDA_SESSION',
    payload: {
      entityType:   'Project',
      entityId:     payload.projectId ?? 'unlinked',
      action:       'lamda_session',
      changedBy:    'lamda',
      reason:       `LAMDA ${payload.role} analysis: ${payload.userInput.slice(0, 120)}${payload.userInput.length > 120 ? '…' : ''}`,
      newValue:     JSON.stringify({
        role:        payload.role,
        userInput:   payload.userInput.slice(0, 500),
        handoff:     payload.handoff,
        mindaNote:   payload.parsed.mindaNote,
        timestamp:   new Date().toISOString(),
      }),
    },
  });

  const res = await fetch(`${MINDA_API}/webhooks/lamda`, {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Inter-Secret':  INTER_SECRET,
    },
    body,
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    throw new Error(`MINDA returned ${res.status}: ${await res.text()}`);
  }
}

async function sendToGuida(payload: {
  analysis:     string;
  userInput:    string;
  role:         string;
  projectId?:   string;
  guidaContext?: string;
}): Promise<void> {
  const body = JSON.stringify({
    source:    'LAMDA',
    eventType: 'DEVELOPMENT_CONTEXT',
    payload: {
      projectId:    payload.projectId ?? null,
      role:         payload.role,
      input:        payload.userInput.slice(0, 500),
      guidaContext: payload.guidaContext,
      timestamp:    new Date().toISOString(),
    },
  });

  const res = await fetch(`${GUIDA_API}/events/lamda`, {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Inter-Secret':  INTER_SECRET,
    },
    body,
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    throw new Error(`GUIDA returned ${res.status}: ${await res.text()}`);
  }
}

export async function POST(req: Request) {
  try {
    const { analysis, userInput, role = 'Writer', projectId } = await req.json();

    if (!analysis || typeof analysis !== 'string') {
      return new Response(JSON.stringify({ error: 'analysis string required' }), { status: 400 });
    }

    const handoff = extractHandoff(analysis);
    if (!handoff) {
      return new Response(JSON.stringify({
        sent:    [],
        errors:  [],
        skipped: 'No SUITE HANDOFF block found in analysis',
      }));
    }

    const parsed = parseHandoff(handoff);
    const sent: string[]   = [];
    const errors: string[] = [];

    // Send to MINDA (non-fatal)
    try {
      await sendToMinda({ analysis, handoff, userInput, role, projectId, parsed });
      sent.push('MINDA');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[suite-handoff] MINDA send failed:', msg);
      errors.push(`MINDA: ${msg}`);
    }

    // Send to GUIDA if we have a context block (non-fatal)
    if (parsed.guidaContext) {
      try {
        await sendToGuida({ analysis, userInput, role, projectId, guidaContext: parsed.guidaContext });
        sent.push('GUIDA');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[suite-handoff] GUIDA send failed:', msg);
        errors.push(`GUIDA: ${msg}`);
      }
    }

    return new Response(JSON.stringify({ sent, errors, handoffLength: handoff.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[suite-handoff] handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
