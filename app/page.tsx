import Link from 'next/link';
import LaMark from './components/LaMark';

export default function Landing() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

        .landing { background: #1a1d2e; color: #e8e6e1; min-height: 100vh; }

        .l-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.4rem 8vw;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(26,29,46,0.88); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(200,169,110,0.12);
        }
        .l-nav-brand {
          font-family: -apple-system, sans-serif; font-size: 0.72rem;
          font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase;
          color: #c8a96e;
        }
        .l-nav-link {
          font-family: -apple-system, sans-serif; font-size: 0.72rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(232,230,225,0.45); text-decoration: none;
          transition: color 0.15s;
        }
        .l-nav-link:hover { color: #c8a96e; }

        .l-screen {
          min-height: 100vh; display: flex; flex-direction: column;
          justify-content: center; padding: 100px 8vw 80px;
        }
        .l-screen--alt { background: #151726; }
        .l-screen--dark { background: #12141f; }
        .l-screen--center { align-items: center; text-align: center; }

        .l-label {
          font-family: -apple-system, sans-serif; font-size: 0.65rem;
          font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
          color: #c8a96e; margin-bottom: 2rem;
        }

        .l-headline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(2.4rem, 4.5vw, 4.8rem);
          font-weight: 400; line-height: 1.08;
          color: #c8a96e; letter-spacing: -0.01em;
          margin-bottom: 2rem;
        }
        .l-headline--white { color: #e8e6e1; }

        .l-body {
          font-family: -apple-system, sans-serif;
          font-size: clamp(0.95rem, 1.3vw, 1.1rem);
          line-height: 1.8; color: rgba(232,230,225,0.6);
          max-width: 560px;
        }

        .l-rule {
          width: 100%; height: 1px;
          background: rgba(200,169,110,0.25);
          margin: 2.5rem 0; border: none;
        }

        .l-feature-list { list-style: none; padding: 0; margin: 0; max-width: 640px; }
        .l-feature-list li {
          font-family: -apple-system, sans-serif;
          font-size: clamp(0.95rem, 1.3vw, 1.1rem);
          line-height: 1.55; color: #e8e6e1;
          padding: 0.9rem 0; border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; gap: 1rem; align-items: flex-start;
        }
        .l-feature-list li::before {
          content: '—'; color: #c8a96e; flex-shrink: 0;
        }

        .l-for-text {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(1.2rem, 2vw, 1.8rem);
          font-style: italic; font-weight: 400;
          line-height: 1.45; color: #e8e6e1;
          margin-bottom: 1.75rem; max-width: 680px;
        }

        .l-cta {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: #c8a96e; color: #12141f;
          font-family: -apple-system, sans-serif; font-size: 0.9rem;
          font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          text-decoration: none; padding: 0.9rem 2rem;
          border-radius: 4px; transition: opacity 0.15s; margin-top: 2.5rem;
        }
        .l-cta:hover { opacity: 0.85; }

        .l-footer {
          padding: 1.8rem 8vw; border-top: 1px solid rgba(200,169,110,0.1);
          background: #12141f;
          font-family: -apple-system, sans-serif; font-size: 0.72rem;
          color: rgba(232,230,225,0.3); letter-spacing: 0.06em;
          display: flex; justify-content: space-between; align-items: center;
        }
      `}</style>

      <div className="landing">

        {/* NAV */}
        <nav className="l-nav">
          <span className="l-nav-brand">LAMDA</span>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#what" className="l-nav-link">What it does</a>
            <a href="#who" className="l-nav-link">Who it's for</a>
            <Link href="/chat" className="l-nav-link" style={{ color: '#c8a96e' }}>Open LAMDA →</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="l-screen l-screen--center" style={{ paddingTop: '140px' }}>
          <div style={{ marginBottom: '3rem' }}>
            <LaMark size={180} color="#c8a96e" />
          </div>
          <div className="l-label">lamda.mov</div>
          <h1 className="l-headline" style={{ maxWidth: '700px' }}>
            Any script mapped to<br />cinema history<br />in seconds.
          </h1>
          <p className="l-body" style={{ margin: '0 auto', textAlign: 'center', maxWidth: '460px' }}>
            Research engine and script doctor for filmmakers. Comp titles from any
            tradition. Structural diagnosis with a precedent for every problem it finds.
          </p>
          <Link href="/chat" className="l-cta">
            Open LAMDA →
          </Link>
          <p style={{
            marginTop: '3rem', fontFamily: 'sans-serif', fontSize: '0.7rem',
            letterSpacing: '0.18em', color: 'rgba(200,169,110,0.4)', textTransform: 'uppercase',
          }}>
            Part of DA SUITE &nbsp;·&nbsp; dasuite.mov
          </p>
        </section>

        {/* WHAT IT DOES */}
        <section className="l-screen l-screen--alt" id="what">
          <div className="l-label">What LAMDA does</div>
          <h2 className="l-headline l-headline--white" style={{ marginBottom: '1rem' }}>
            Not just Hollywood.<br />Every tradition.
          </h2>
          <ul className="l-feature-list">
            <li>Comp titles drawn from any narrative tradition — Greek, Japanese, West African, Nordic, Latin American, Iranian, Korean — not only the US studio canon</li>
            <li>Script diagnostic: every structural problem identified, with a specific film precedent and a concrete fix</li>
            <li>Myth and narrative structure mapping — surfaces which tradition your story is actually working in, and why that matters for how it's read</li>
            <li>Pitch preparation across all four scenarios: the corridor, the party, the private room, the podium</li>
            <li>Role-specific reports — writer, director, producer, editor — each with a different lens on the same material</li>
            <li>Responds in the language of the input. Bilingual output on request.</li>
          </ul>
        </section>

        {/* THE TWO MODES */}
        <section className="l-screen l-screen--dark">
          <div className="l-label">Two modes</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', maxWidth: '800px' }}>
            <div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem',
                fontWeight: 400, color: '#c8a96e', marginBottom: '1rem', lineHeight: 1.2,
              }}>Research Engine</h3>
              <p className="l-body">
                Paste a logline or one-paragraph premise. LAMDA returns comp titles,
                archetype breakdown, structural pattern, genre positioning, and market context.
                Immediate. Structured. Specific.
              </p>
            </div>
            <div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem',
                fontWeight: 400, color: '#c8a96e', marginBottom: '1rem', lineHeight: 1.2,
              }}>Script Doctor</h3>
              <p className="l-body">
                Paste screenplay pages, a treatment, or a beat sheet. LAMDA runs a full
                diagnostic — act structure, protagonist agency, tonal consistency, pacing,
                dialogue, and specific problems with specific fixes.
              </p>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="l-screen" id="who">
          <div className="l-label">Who needs this</div>
          <p className="l-for-text">— The writer who knows Act 2 isn't working but can't see why, and needs to know which film solved exactly this problem.</p>
          <p className="l-for-text">— The director whose story structure doesn't fit the three-act template — because it was never a three-act story. It's a different tradition entirely, and it needs to be read on those terms.</p>
          <p className="l-for-text">— The producer who needs comp titles that mean something to a European broadcaster, not just a US studio.</p>
          <p className="l-for-text">— The filmmaker who has been writing in isolation and needs a rigorous, specific, film-literate interlocutor.</p>
          <hr className="l-rule" />
          <p className="l-body">Every independent filmmaker developing a project. Every production company that takes story seriously.</p>
        </section>

        {/* CTA */}
        <section className="l-screen l-screen--dark l-screen--center">
          <div style={{ marginBottom: '2rem' }}>
            <LaMark size={100} color="#c8a96e" />
          </div>
          <h2 className="l-headline" style={{ marginBottom: '0.5rem' }}>
            What are you working on?
          </h2>
          <hr className="l-rule" style={{ maxWidth: '400px', margin: '1.5rem auto' }} />
          <Link href="/chat" className="l-cta">
            Open LAMDA →
          </Link>
          <p style={{
            marginTop: '3.5rem', fontFamily: 'sans-serif', fontSize: '0.68rem',
            letterSpacing: '0.18em', color: 'rgba(200,169,110,0.35)', textTransform: 'uppercase',
          }}>
            LAMDA &nbsp;·&nbsp; Part of DA SUITE &nbsp;·&nbsp; Maria v. Heland &nbsp;·&nbsp; 2026
          </p>
        </section>

        <footer className="l-footer">
          <span>LAMDA &nbsp;·&nbsp; lamda.mov</span>
          <span style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href="https://dasuite.mov/legal" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.6 }}>Legal &amp; Privacy</a>
            <span>DA SUITE &nbsp;·&nbsp; dasuite.mov</span>
          </span>
        </footer>

      </div>
    </>
  );
}
