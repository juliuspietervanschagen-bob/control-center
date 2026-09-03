# JR Intelligence outreach

Automated B2B cold-email system for JR Intelligence. It reads a leads CSV, writes a subject line and a 100–200 word body in English or Dutch, compiles an Outlook-safe HTML email, then either saves a dry-run preview or sends through SMTP with human-like delay.

The copy rules live in `.cursor/skills/` and are injected into the LLM prompts at runtime:

- `bilingual-copywriter` — length, native grammar, anti-AI phrasing, tone
- `context-injector` — greeting, mandatory Rik & Julius intro, industry observation, soft CTA
- `html-template-designer` — table layout, subtle geometric SVG background, inlined CSS
- `compliance-and-dispatch` — opt-out footer, 3–9 minute jitter, duplicate tracking

## What you get

1. CSV ingestion (`CompanyName`, `ContactEmail`, `Industry`, `LanguagePreference`)
2. Subject line under 7 words, grounded in the industry
3. Body that always includes the JR Intelligence introduction
4. HTML with inlined CSS (`juice`) and a low-contrast geometric pattern
5. `--dry-run` writes reviewable HTML to `dist/test-emails/`
6. Live SMTP send with jitter and `campaign_state.json` so the same address is not mailed twice

No API key is required for dry-run. Without `OPENAI_API_KEY` the local composer still follows the same structure and constraints.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` if you want live OpenAI copy or SMTP delivery.

## Dry-run (review in the browser)

```bash
npm run dry-run
```

Opens a local gallery at `http://127.0.0.1:43147`. Each lead becomes an HTML file under `dist/test-emails/`. Nothing is sent.

```bash
npx ts-node src/main.ts --dry-run --limit 2
npx ts-node src/main.ts --dry-run --leads ./leads.csv --preview
```

## Live send

Set SMTP variables in `.env`, then:

```bash
npm run send
```

Waits a random 3–9 minutes between messages. Skip the wait only when you are testing the transport:

```bash
npx ts-node src/main.ts --skip-jitter --limit 1
```

Already-sent addresses are skipped. Override with `--force`.

## Leads CSV

```csv
CompanyName,ContactEmail,Industry,LanguagePreference
Harbor & Co Logistics,contact@harborco.example,regional logistics,en
Bakkerij De Gouden Korrel,info@goudenkorrel.example,artisan bakery,nl
```

`LanguagePreference` accepts `en` / `nl` (also `english`, `dutch`, `nederlands`).

## Layout

```
src/config     env, constants, types
src/leads      CSV parser
src/llm        subject, copywriter, skill loader, orchestrator
src/templates  table markup, SVG pattern, juice inlining
src/mailer     Nodemailer transport, jitter, dispatcher
src/db         campaign_state.json (duplicate guard)
src/preview    static gallery server
src/main.ts    CLI entry
```

## Environment

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Optional. Empty = local composer |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Live dispatch |
| `LEADS_CSV` | Path to leads file |
| `CAMPAIGN_STATE_PATH` | Duplicate-send log |
| `OPTOUT_EMAIL` | Footer + `List-Unsubscribe` |
| `JITTER_MIN_MINUTES` / `JITTER_MAX_MINUTES` | Pause between live sends |
