# LAMDA Deployment Guide

Get LAMDA live at **lamda.mov** in about 15 minutes.

---

## What you have

- ✅ Code pushed to `github.com/MariavHeland/lamda`
- ✅ Domain `lamda.mov` registered at Namecheap
- ✅ All environment variables documented in `.env.example`
- ✅ Build tested clean (51MB output, 32–36KB per function + traced data files)
- ✅ Auth gate working (verified with smoke tests)

---

## Step 1 — Deploy to Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. **Import Git Repository** → select `MariavHeland/lamda`
3. Vercel auto-detects Next.js. Leave build settings as default.
4. **Environment Variables** (critical — add all that apply):

   | Key | Value | Required? |
   |-----|-------|-----------|
   | `ANTHROPIC_API_KEY` | Your Anthropic key (`sk-ant-api03-...`) | **YES** |
   | `LAMDA_PASSWORD` | Strong password for the login gate | **YES** |
   | `LAMDA_SUITE` | `false` (for now — flip to `true` when MINDA/GUIDA are live) | No |
   | `MINDA_API_URL` | MINDA production URL + `/api` | No |
   | `GUIDA_API_URL` | GUIDA production URL + `/api` | No |
   | `INTER_SERVICE_SECRET` | Shared secret matching MINDA/GUIDA | No |

5. **Deploy.** Wait ~2 minutes.

You'll get a URL like `lamda-abc123.vercel.app`. Test it:
- Visit `/` → should redirect to `/login`
- Log in with `LAMDA_PASSWORD` → should land on `/`
- Navigate to `/chat` → should load the LAMDA interface

---

## Step 2 — Check Vercel plan (important)

Your `/api/analyze` route has `maxDuration = 120` seconds (script analysis can run long for full screenplays).

- **Hobby plan:** 10-second function timeout. **Analyze will fail on long inputs.**
- **Pro plan ($20/mo):** 60-second default, configurable up to 300s. **Recommended.**

If you're on Hobby, either upgrade to Pro or drop `maxDuration` to `10` in `app/api/analyze/route.ts` and accept that long-script analysis will sometimes time out.

---

## Step 3 — Connect lamda.mov on Namecheap

### In Vercel first:
1. In your project → **Settings** → **Domains**
2. Click **Add** → enter `lamda.mov` → **Add**
3. Also add `www.lamda.mov` → **Add** (Vercel will redirect www → apex)
4. Vercel will show the required DNS records. **Keep that tab open.**

Vercel will show you one of two setups depending on what it recommends:

**Option A — Apex (`lamda.mov`) with A record:**
```
Type: A      Host: @      Value: 76.76.21.21
Type: CNAME  Host: www    Value: cname.vercel-dns.com.
```

**Option B — CNAME for everything (if Vercel recommends Flatten or ALIAS):**
```
Type: ALIAS   Host: @      Value: cname.vercel-dns.com.
Type: CNAME   Host: www    Value: cname.vercel-dns.com.
```

Namecheap supports ALIAS via its "ALIAS Record" type. If in doubt, use Option A.

### In Namecheap:
1. Log in → **Domain List** → find `lamda.mov` → **Manage**
2. Go to the **Advanced DNS** tab
3. **Delete any existing default records** (the "Parking Page" URL Redirect, any CNAME to `parkingpage.namecheap.com`)
4. Add the records from Vercel:
   - Click **Add New Record**
   - Type: `A Record`, Host: `@`, Value: `76.76.21.21`, TTL: Automatic
   - Click **Add New Record**
   - Type: `CNAME Record`, Host: `www`, Value: `cname.vercel-dns.com.`, TTL: Automatic
5. Save (green checkmark).

### Back in Vercel:
Click the **Refresh** or **Verify** button next to each domain. Within 1–30 minutes they'll turn green with SSL certs auto-provisioned.

Typical propagation: 5–15 minutes. Can take up to 48 hours in worst case but almost never does for Vercel.

---

## Step 4 — Verify

```bash
# These should all return Vercel responses, not parking page
curl -I https://lamda.mov
curl -I https://www.lamda.mov
```

Visit **https://lamda.mov** in a browser. You should see the login page. Log in with `LAMDA_PASSWORD`. Everything should work.

---

## Step 5 — Post-deploy

### Test the full flow
1. Log in.
2. Paste a logline. Should get comp titles + structural analysis.
3. Upload a short PDF script. Should parse and load into input.
4. Run an analysis. Should stream response.
5. Try each role (Writer / Producer / Director / Editor) — output should shift lens.

### If something breaks
- **Build fails on Vercel but works locally:** check Node version (Vercel uses 20 by default; your package.json doesn't pin). Usually fine.
- **`fs.readFileSync` errors in production:** the `.nft.json` trace files in `.next/server/app/api/analyze/` list all 14 data files — already verified. If this ever breaks, add to `next.config.ts`:
  ```ts
  outputFileTracingIncludes: {
    '/api/analyze': ['./data/**/*'],
  }
  ```
- **`/api/analyze` returns 504 Gateway Timeout:** function exceeded `maxDuration`. Upgrade Vercel plan, or shorten analysis.
- **`/api/upload` fails on large PDFs:** `pdf-parse` can be slow. Consider a 60s timeout is usually enough.

### Monitoring
- **Vercel Logs:** project → **Logs** tab → filter by function
- **Usage:** project → **Usage** tab → watch function invocations and duration

---

## Known gotchas for Next.js 16 on Vercel

- **`proxy.ts` is Next 16's new middleware convention.** Vercel 16-compatible deploys handle it correctly, but if deploying elsewhere, check the target supports it.
- **Turbopack in dev, webpack in build.** Vercel uses webpack for builds. No issue expected.
- **Streaming responses:** `/api/analyze` uses ReadableStream. Vercel fully supports this on Node.js runtime (already set via `export const runtime = 'nodejs'`).

---

## Going forward

### When MINDA and GUIDA go live:
1. Deploy MINDA and GUIDA to their own Vercel projects (or wherever).
2. In LAMDA's Vercel env vars, set:
   - `LAMDA_SUITE=true`
   - `MINDA_API_URL=https://minda.mov/api` (or wherever)
   - `GUIDA_API_URL=https://guida.mov/api`
   - `INTER_SERVICE_SECRET=<same value as set in MINDA/GUIDA>`
3. Redeploy. Suite Handoff will now fire.

### If you ever need to rotate the password:
Change `LAMDA_PASSWORD` in Vercel env vars → redeploy. Existing sessions remain valid until their cookie expires (30 days).

### If you ever need to rotate the API key:
Change `ANTHROPIC_API_KEY` in Vercel env vars → redeploy. No code change needed.

---

## TL;DR ship list

1. [ ] Push to GitHub — **DONE**
2. [ ] Import repo in Vercel
3. [ ] Set env vars in Vercel (at minimum: `ANTHROPIC_API_KEY`, `LAMDA_PASSWORD`)
4. [ ] Deploy → verify at vercel-generated URL
5. [ ] Add `lamda.mov` + `www.lamda.mov` as domains in Vercel
6. [ ] In Namecheap Advanced DNS: delete parking records, add A record + CNAME record
7. [ ] Wait 5–15 min, verify SSL issued, visit https://lamda.mov
8. [ ] Smoke test: login → paste logline → paste script → upload PDF → switch roles

That's it. Ship it.
