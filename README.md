# LAMDA

**Any script mapped to cinema history in seconds.**

AI-powered research engine and script doctor for filmmakers. Part of DA SUITE.

`lamda.mov` · Maria v. Heland · 2026

---

## What It Does

Two modes, auto-detected from the input:

### Research Engine (fast)
Paste a logline or one-paragraph premise. Returns comp titles, archetype breakdown, structural pattern, genre positioning, market context, and narrative tradition mapping — in seconds.

### Script Doctor (diagnostic)
Paste screenplay pages, a treatment, or upload a PDF/DOCX. Returns a full structural diagnostic: act structure, protagonist agency, tonal consistency, dialogue/subtext audit, pacing benchmarks, and specific problems with specific film precedents and concrete fixes.

### Role-Specific Views
Writer, Producer, Director, Editor — each gets a different lens on the same material.

### What Makes It Different
LAMDA doesn't only analyze through Hollywood three-act structure. It recognizes 16+ world narrative traditions — kishōtenketsu, Norse fatalism, cyclical mythology, songline narrative, griot structure — and evaluates screenplays on the tradition's own terms.

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Anthropic SDK** — Claude Sonnet 4.6, streaming
- **File parsing**: `pdf-parse` (PDF), `mammoth` (DOCX)
- **Markdown rendering**: `react-markdown` + `remark-gfm`
- **Auth**: cookie-based password gate via `proxy.ts` (Next 16's renamed middleware convention)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in:

```bash
ANTHROPIC_API_KEY=sk-ant-...
LAMDA_SUITE=false
```

When running alongside other DA SUITE apps, also set:
```bash
MINDA_API_URL=http://localhost:3002/api
GUIDA_API_URL=http://localhost:3000/api
INTER_SERVICE_SECRET=your-shared-secret
```

### 3. Run
```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

**Default password:** see `app/api/auth/route.ts`. Change it before deploying publicly.

### 4. Build
```bash
npm run build
npm start
```

---

## Project Structure

```
lamda/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Password gate
│   ├── chat/page.tsx         # Main LAMDA interface
│   ├── components/LaMark.tsx # Logo component
│   └── api/
│       ├── analyze/          # Main Claude streaming endpoint
│       ├── upload/           # PDF/DOCX/TXT file parsing
│       ├── auth/             # Login (sets cookie)
│       ├── suite-handoff/    # Dispatch to MINDA/GUIDA when suite mode on
│       └── debug/            # Dev-only env check (404s in prod)
├── lib/
│   └── system-prompt.ts      # Builds the Claude system prompt
├── data/
│   ├── Lamda_Claude_Prompt.md     # Core persona + instructions
│   └── mythology/                 # ~860K of structure + mythology reference
└── proxy.ts                       # Auth gate (Next.js 16 middleware)
```

---

## The Knowledge Base

`data/mythology/` contains ~860,000 characters of structured research:

- **16 world narrative traditions** — Greek, Norse, Japanese, Hindu, Yoruba, Aztec/Maya, Celtic, Aboriginal, and more — with the structural logic of each
- **12 structural theories** — Aristotle, Field, McKee, Snyder, Truby, Vogler, Campbell, Egri, Daniel, Harmon, Mazin
- **14 genre templates** with structural DNA
- **9 art-house structural modes** plus anti-structure manifestos (Godard, Tarkovsky, Bresson, Cassavetes, Malick, Wong Kar-wai, Claire Denis, Weerasethakul)
- **Award-winning cinema analysis** — Palme d'Or, Best Picture, festival signatures
- **TV series structure** — Sopranos, The Wire, Breaking Bad, Fleabag, Succession
- **Scene-level diagnostics** — dialogue, subtext, tension, character arcs
- **250+ mythological creatures** catalogued by tradition
- **The unified structural principles** — what holds across all traditions

The full corpus stays on disk. Condensed summaries are injected into the system prompt at request time by `lib/system-prompt.ts`.

---

## DA SUITE Integration

LAMDA is part of DA SUITE (LAMDA, GUIDA, AYDA, MINDA, KALDA, POSDA). When the user toggles Suite mode in the UI, each analysis ends with a SUITE HANDOFF block that `/api/suite-handoff` parses and dispatches:

- **MINDA** (`localhost:3002`) — stores the session as a project memory note
- **GUIDA** (`localhost:3000`) — receives development context

Failures to reach sibling apps are non-fatal — the handoff is fire-and-forget.

---

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze` | POST | Main streaming Claude endpoint. Body: `{ messages, suiteEnabled?, role? }` |
| `/api/upload` | POST | Multipart form with `file` (PDF/DOCX/TXT/Fountain/FDX). Returns extracted text |
| `/api/auth` | POST | Login. Body: `{ password }`. Sets `lamda_auth` cookie |
| `/api/suite-handoff` | POST | Parses SUITE HANDOFF block and dispatches to MINDA + GUIDA |
| `/api/debug` | GET | Dev-only env sanity check. 404s in production |

---

## Language Support

LAMDA auto-detects the input language and responds in kind. Configurable:

| Key | Behavior |
|-----|----------|
| `LAMDA_LANG_DUAL=true` | Bilingual output (primary + English) |
| `LAMDA_LANG_PRIMARY=sv\|de\|fr\|es` | Force primary language |
| `LAMDA_LANG_TERMS=en` | Keep film terminology in English |

Film references use original title followed by release title: *Det sjunde inseglet (The Seventh Seal)*.

---

## Deployment

Vercel-ready. Push to GitHub, connect repo in Vercel, set environment variables. Point `lamda.mov` at the Vercel deployment.

Required Vercel env vars:
- `ANTHROPIC_API_KEY`
- `LAMDA_SUITE` (optional)
- `MINDA_API_URL`, `GUIDA_API_URL`, `INTER_SERVICE_SECRET` (if integrating with DA SUITE)

---

## License

Proprietary. Part of DA SUITE.
