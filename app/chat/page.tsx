'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LaMark from '../components/LaMark';

type Role = 'user' | 'assistant';
interface Message { role: Role; content: string; }
type Mode = 'Research Engine' | 'Script Doctor' | null;

function detectMode(text: string): Mode {
  const lower = text.toLowerCase();
  if (lower.includes('int.') || lower.includes('ext.') || lower.split('\n').length > 30) return 'Script Doctor';
  if (lower.includes('treatment') || lower.includes('beat sheet') || lower.includes('act ')) return 'Script Doctor';
  return 'Research Engine';
}

const PLACEHOLDER = `Paste a logline, treatment, or screenplay pages.

LAMDA detects the input type automatically — Research Engine for loglines and pitches, Script Doctor for scripts and treatments.

Or ask directly:
"What are the best comps for a film about..."
"What's not working in this act structure?"
"What mythological tradition is closest to this story?"`;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [suiteEnabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 320) + 'px';
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setMode(detectMode(text));
    const userMsg: Message = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    setStreaming(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, suiteEnabled }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) throw new Error('Request failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = { role: 'assistant', content: acc };
          return u;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = { role: 'assistant', content: '_Connection error. Check that ANTHROPIC_API_KEY is set._' };
          return u;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, suiteEnabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  };

  const reset = () => {
    if (streaming) abortRef.current?.abort();
    setMessages([]); setMode(null); setInput('');
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity" style={{ textDecoration: 'none' }}>
            <LaMark size={32} />
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-geist-sans)' }}>
              LAMDA
            </span>
          </a>
          {mode && (
            <span className="text-sm font-medium uppercase" style={{ color: 'var(--accent)', letterSpacing: '0.12em', fontFamily: 'var(--font-geist-sans)' }}>
              {mode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-6">
          {!isEmpty && (
            <button onClick={reset} className="text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-geist-sans)' }}>
              New session
            </button>
          )}
          <span className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-geist-sans)' }}>lamda.mov</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div style={{ marginBottom: '2.5rem', opacity: 0.9 }}>
              <LaMark size={140} />
            </div>
            <p className="uppercase mb-5" style={{
              fontFamily: 'var(--font-geist-sans)', fontSize: '0.72rem',
              letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 600,
            }}>
              Research Engine &amp; Script Doctor
            </p>
            <h2 style={{
              fontFamily: 'var(--font-geist-sans)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)',
              maxWidth: '500px', lineHeight: 1.2, marginBottom: '1.25rem',
            }}>
              What are you working on?
            </h2>
            <p style={{
              fontFamily: 'var(--font-geist-sans)', fontSize: '1rem', lineHeight: 1.7,
              color: 'var(--text-muted)', maxWidth: '400px',
            }}>
              Paste a logline for comp titles and structural analysis.
              Paste screenplay pages for a full script doctor diagnostic.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-10" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div>
                    <div className="uppercase mb-3" style={{
                      fontFamily: 'var(--font-geist-sans)', fontSize: '0.7rem',
                      letterSpacing: '0.14em', color: 'var(--text-muted)', fontWeight: 600,
                    }}>You</div>
                    <div style={{
                      fontFamily: 'var(--font-geist-sans)', fontSize: '1rem', lineHeight: 1.75,
                      whiteSpace: 'pre-wrap', color: 'var(--text)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '1.1rem 1.4rem',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="uppercase mb-3 flex items-center gap-2" style={{
                      fontFamily: 'var(--font-geist-sans)', fontSize: '0.7rem',
                      letterSpacing: '0.14em', color: 'var(--accent)', fontWeight: 600,
                    }}>
                      LAMDA
                      {streaming && i === messages.length - 1 && (
                        <span className="inline-block animate-pulse" style={{
                          width: '6px', height: '14px', borderRadius: '2px', background: 'var(--accent)',
                        }} />
                      )}
                    </div>
                    <div className="lamda-output" style={{ fontSize: '1rem' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || '\u00A0'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-8 py-6" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER}
              rows={4}
              disabled={streaming}
              style={{
                width: '100%', resize: 'none', background: 'transparent', outline: 'none',
                fontFamily: 'var(--font-geist-sans)', fontSize: '1rem', lineHeight: 1.7,
                color: 'var(--text)', padding: '1.25rem 1.5rem', minHeight: '120px',
                display: 'block',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem 0.85rem' }}>
              <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {streaming ? 'Analysing…' : '⌘ Return to send'}
              </span>
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                style={{
                  fontFamily: 'var(--font-geist-sans)', fontSize: '0.85rem', fontWeight: 500,
                  padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                  background: input.trim() && !streaming ? 'var(--accent)' : 'var(--border)',
                  color: input.trim() && !streaming ? '#0c0c0c' : 'var(--text-muted)',
                  letterSpacing: '0.04em', transition: 'all 0.15s',
                }}
              >
                {streaming ? 'Working…' : 'Analyse'}
              </button>
            </div>
          </div>
          {!isEmpty && (
            <p style={{ textAlign: 'center', marginTop: '1rem', fontFamily: 'var(--font-geist-sans)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Continue the session or{' '}
              <button onClick={reset} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 'inherit' }}>
                start fresh
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
