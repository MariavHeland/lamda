'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: input }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-geist-sans)',
    }}>
      <div style={{ width: '100%', maxWidth: '360px', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.18em',
            color: 'var(--accent)', marginBottom: '0.4rem',
          }}>LAMDA</div>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Research Engine &amp; Script Doctor
          </div>
        </div>

        <form onSubmit={submit} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '1.75rem',
        }}>
          <label style={{
            display: 'block', fontSize: '0.7rem', fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: '0.6rem',
          }}>Password</label>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            style={{
              width: '100%', background: 'var(--bg)',
              border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
              borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.9rem',
              color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
          {error && (
            <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.5rem' }}>
              Incorrect password.
            </p>
          )}
          <button type="submit" style={{
            width: '100%', marginTop: '1.1rem', padding: '0.65rem',
            background: 'var(--accent)', color: '#0c0c0c', border: 'none',
            borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit',
          }}>
            Enter
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '1.5rem',
          fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em',
        }}>
          lamda.mov · Part of DA SUITE
        </p>
      </div>
    </div>
  );
}
