'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LaMark from '../components/LaMark';

type Role = 'user' | 'assistant';
interface Message { role: Role; content: string; }
type Mode = 'Research Engine' | 'Script Doctor' | null;
type LamdaRole = 'Writer' | 'Producer' | 'Director' | 'Editor';

const ROLES: LamdaRole[] = ['Writer', 'Producer', 'Director', 'Editor'];

function detectMode(text: string): Mode {
  const lower = text.toLowerCase();
  if (lower.includes('int.') || lower.includes('ext.') || lower.split('\n').length > 30) return 'Script Doctor';
  if (lower.includes('treatment') || lower.includes('beat sheet') || lower.includes('act ')) return 'Script Doctor';
  return 'Research Engine';
}

const PLACEHOLDER = `Paste a logline, treatment, or screenplay pages — or upload a PDF/DOCX.

LAMDA detects the input type automatically.

Research Engine → loglines and pitches
Script Doctor → treatments, beat sheets, screenplay pages`;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [role, setRole] = useState<LamdaRole>('Writer');
  const [suiteEnabled, setSuiteEnabled] = useState(false);
  const [suiteSent, setSuiteSent] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<{ filename: string; pages: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadInfo(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setInput(data.text);
      setUploadInfo({ filename: file.name, pages: data.estimatedPages });
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 320) + 'px';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setMode(detectMode(text));
    setUploadInfo(null);
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
        body: JSON.stringify({ messages: history, suiteEnabled, role }),
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

      // Suite Handoff — fire after streaming is complete
      if (suiteEnabled && acc.length > 0) {
        setSuiteSent([]);
        fetch('/api/suite-handoff', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ analysis: acc, userInput: text, role }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.sent?.length) setSuiteSent(data.sent as string[]);
          })
          .catch(err => console.warn('[suite-handoff] non-fatal error:', err));
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
  }, [input, messages, streaming, suiteEnabled, role]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  };

  const reset = () => {
    if (streaming) abortRef.current?.abort();
    setMessages([]); setMode(null); setInput(''); setUploadInfo(null); setSuiteSent([]);
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

        {/* Right controls */}
        <div className="flex items-center gap-5">
          {/* Role selector */}
          <div className="flex items-center gap-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  fontFamily: 'var(--font-geist-sans)', fontSize: '0.7rem',
                  fontWeight: role === r ? 600 : 400,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '0.3rem 0.7rem', borderRadius: '5px', border: 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: role === r ? 'var(--accent)' : 'transparent',
                  color: role === r ? '#0c0c0c' : 'var(--text-muted)',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Suite toggle + handoff status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setSuiteEnabled(p => !p)}
              title="Enable DA SUITE handoff block — sends analysis to MINDA + GUIDA on completion"
              style={{
                fontFamily: 'var(--font-geist-sans)', fontSize: '0.7rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s',
                background: suiteEnabled ? 'rgba(200,169,110,0.12)' : 'transparent',
                color: suiteEnabled ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              Suite {suiteEnabled ? '●' : '○'}
            </button>
            {suiteSent.length > 0 && (
              <span title={`Sent to: ${suiteSent.join(', ')}`} style={{
                fontFamily: 'var(--font-geist-sans)', fontSize: '0.62rem',
                color: 'var(--accent)', letterSpacing: '0.06em',
              }}>
                → {suiteSent.join(' · ')}
              </span>
            )}
          </div>

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
              color: 'var(--text-muted)', maxWidth: '420px',
            }}>
              Paste a logline for comp titles and structural analysis.
              Paste screenplay pages — or upload a PDF — for a full script doctor diagnostic.
            </p>

            {/* Role picker cards */}
            <div style={{
              marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem', maxWidth: '560px',
            }}>
              {([
                ['Writer', 'Structural diagnosis, character agency, dialogue'],
                ['Producer', 'Comp titles, market viability, pitch risks'],
                ['Director', 'Tone, visual language, emotional momentum'],
                ['Editor', 'Pacing, scene count, rhythm benchmarks'],
              ] as [LamdaRole, string][]).map(([r, desc]) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    background: role === r ? 'rgba(200,169,110,0.1)' : 'var(--surface)',
                    border: `1px solid ${role === r ? 'rgba(200,169,110,0.4)' : 'var(--border)'}`,
                    borderRadius: '8px', padding: '0.75rem 0.6rem',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-geist-sans)', fontSize: '0.68rem',
                    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: role === r ? 'var(--accent)' : 'var(--text)', marginBottom: '0.35rem',
                  }}>{r}</div>
                  <div style={{
                    fontFamily: 'var(--font-geist-sans)', fontSize: '0.7rem',
                    lineHeight: 1.4, color: 'var(--text-muted)',
                  }}>{desc}</div>
                </button>
              ))}
            </div>
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
                      maxHeight: '200px', overflowY: 'auto',
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
                      <span style={{
                        fontSize: '0.62rem', letterSpacing: '0.08em',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                        fontWeight: 400,
                      }}>— {role} view</span>
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

          {uploadInfo && (
            <div style={{
              marginBottom: '0.6rem', padding: '0.5rem 0.9rem',
              background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.25)',
              borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '0.78rem', color: 'var(--accent)' }}>
                📄 {uploadInfo.filename} · ~{uploadInfo.pages} pages loaded
              </span>
              <button
                onClick={() => { setUploadInfo(null); setInput(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
              >✕</button>
            </div>
          )}

          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER}
              rows={4}
              disabled={streaming || uploading}
              style={{
                width: '100%', resize: 'none', background: 'transparent', outline: 'none',
                fontFamily: 'var(--font-geist-sans)', fontSize: '1rem', lineHeight: 1.7,
                color: 'var(--text)', padding: '1.25rem 1.5rem', minHeight: '120px',
                display: 'block',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem 0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.fountain,.fdx"
                  onChange={handleUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={streaming || uploading}
                  title="Upload PDF, DOCX, TXT, or Fountain screenplay"
                  style={{
                    fontFamily: 'var(--font-geist-sans)', fontSize: '0.78rem',
                    padding: '0.4rem 0.75rem', borderRadius: '5px',
                    border: '1px solid var(--border)',
                    cursor: streaming || uploading ? 'not-allowed' : 'pointer',
                    background: 'transparent', color: 'var(--text-muted)',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                >
                  {uploading ? '⏳ Loading…' : '↑ Upload script'}
                </button>
                <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {streaming ? 'Analysing…' : '⌘ Return to send'}
                </span>
              </div>
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                style={{
                  fontFamily: 'var(--font-geist-sans)', fontSize: '0.85rem', fontWeight: 500,
                  padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
                  cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
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
