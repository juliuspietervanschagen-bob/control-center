# JR Intelligence Control Center

Live control panel for JR Intelligence outreach. Sync leads from the external dashboard, generate bilingual drafts, review and edit them, send over SMTP, and push `CONTACTED` back to the dashboard.

## Run

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Opens at `http://127.0.0.1:43149`.

If `DASHBOARD_USE_MOCK=true`, the app starts a local dashboard API on port 43148 so the panel works without the production lead system.

## Flow

1. **Sync leads** — pulls pending/uncontacted (and known) leads into SQLite.
2. **Generate draft** — Jina reads the live site, then a 85–150 word EN/NL note: intro, three audit bullets, solution, soft CTA, inlined HTML with a CID signature image.
3. **Review** — click a lead in the left list; the HTML email opens in the main pane (no modal). Edit, regenerate, or send from the sticky bar.
4. **Send via SMTP** — Nodemailer, then PATCH the external dashboard to `CONTACTED`. Selection is kept in `?leadId=`.

Without real SMTP credentials, keep `SMTP_MOCK=true`. Set it to `false` and fill `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` for live delivery.

## Email signature

Outbound HTML includes CID-linked images: the header logo (`cid:jrlogo` → `public/assets/jr-logo.png`) and the footer signature (`cid:jrsignature` → `public/assets/image_029d84.jpg`). Nodemailer attaches both inline — not as Base64 in the HTML.

## Email template

Outbound HTML sits on a 100% `#fafafa` wrapper with a Base64 SVG 45° line hatch (`#e5e7eb` / `#d1d5db`). The 600px card stays solid white (`#ffffff`). Outlook gets `bgcolor="#fafafa"` plus MSO ghost tables. The Control Center UI stays solid — no patterns.

Open `http://127.0.0.1:43149/email-preview.html` for a static sample.

## Skills

`.cursor/skills/` governs copy, HTML, compliance, dashboard sync, signature embedding, email UI, and this UI.

## CLI (still available)

```bash
npm run dry-run
npm run start:worker
npm run test:dashboard
```
