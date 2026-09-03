# JR Intelligence outreach

Automated B2B cold-email system for JR Intelligence. It can run from a CSV, or as a background worker that pulls uncontacted leads from the agency dashboard, writes a subject and 100–200 word EN/NL body, compiles Outlook-safe HTML, sends through SMTP, and reports `CONTACTED` or `FAILED` back to the dashboard.

The copy and dispatch rules live in `.cursor/skills/` and are injected into the pipeline at runtime:

- `bilingual-copywriter` — length, native grammar, anti-AI phrasing, tone
- `context-injector` — greeting, mandatory Rik & Julius intro, industry observation, soft CTA
- `html-template-designer` — table layout, subtle geometric SVG background, inlined CSS
- `compliance-and-dispatch` — opt-out footer, 3–9 minute jitter, duplicate tracking
- `dashboard-extractor` — HTTP client, typed lead payload, status loopback
- `queue-worker-manager` — 10–15 minute polling, sequential sends, idempotency, failure isolation

## What you get

1. CSV ingestion (`CompanyName`, `ContactEmail`, `Industry`, `LanguagePreference`)
2. Dashboard worker that polls pending/uncontacted leads
3. Subject line under 7 words, grounded in the industry
4. Body that always includes the JR Intelligence introduction
5. HTML with inlined CSS (`juice`) and a low-contrast geometric pattern
6. `--dry-run` / `test:dashboard` writes reviewable HTML to `dist/test-emails/`
7. Live SMTP send with 3–9 minute jitter
8. Local idempotency cache plus dashboard `PATCH` so a lead is never mailed twice

No API key is required for dry-run or `test:dashboard`. Without `OPENAI_API_KEY` the local composer still follows the same structure and constraints.

## Setup

```bash
npm install
cp .env.example .env
```

## Dashboard worker

```bash
npm run test:dashboard   # fetch 1 pending lead, generate HTML, do not send or PATCH
npm run start:worker     # poll every 12 minutes, send sequentially, report status
npm run mock:dashboard   # local dashboard API on :43148 (started automatically when DASHBOARD_USE_MOCK=true)
```

Point `DASHBOARD_API_URL` and `DASHBOARD_API_KEY` at the live dashboard when it is available. The client expects:

```
GET  /api/leads?status=PENDING,UNCONTACTED
PATCH /api/leads/:id
Authorization: Bearer <DASHBOARD_API_KEY>
```

Lead payload: `id`, `company_name`, `email`, `industry`, optional `language_preference` (`en` | `nl`). After a successful send the worker PATCHes `status: CONTACTED` with `subject` and `contacted_at`. Failures PATCH `status: FAILED` with `error` and the worker continues.

## CSV dry-run

```bash
npm run dry-run
```

Opens a local gallery at `http://127.0.0.1:43147`.

## Live send from CSV

```bash
npm run send
```

## Layout

```
src/api        dashboard HTTP client and lead mapping
src/worker.ts  polling daemon
src/mock       local dashboard for development
src/config     env, constants, types
src/leads      CSV parser
src/llm        subject, copywriter, skill loader, orchestrator
src/templates  table markup, SVG pattern, juice inlining
src/mailer     Nodemailer transport, jitter, dispatcher
src/db         campaign_state.json (duplicate guard + processed lead IDs)
src/preview    static gallery server
src/main.ts    CLI entry
```

## Environment

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Optional. Empty = local composer |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Live dispatch |
| `DASHBOARD_API_URL` | Dashboard origin. Default `http://127.0.0.1:43148` |
| `DASHBOARD_API_KEY` | Bearer / `X-API-Key` token |
| `DASHBOARD_POLL_MINUTES` | 10–15. Default 12 |
| `DASHBOARD_USE_MOCK` | Start the local dashboard if the URL is down |
| `LEADS_CSV` | Path to leads file (CSV mode) |
| `CAMPAIGN_STATE_PATH` | Duplicate-send log |
| `OPTOUT_EMAIL` | Footer + `List-Unsubscribe` |
| `JITTER_MIN_MINUTES` / `JITTER_MAX_MINUTES` | Pause between live sends |
