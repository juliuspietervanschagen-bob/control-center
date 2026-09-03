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
2. **Generate draft** — Jina reads the live site, then a 85–150 word EN/NL note: intro, three audit bullets, solution, soft CTA, inlined HTML.
3. **Review / edit** — subject and body in the side panel; save to recompile HTML.
4. **Send & complete** — Nodemailer SMTP, then PATCH the external dashboard to `CONTACTED`.

Without real SMTP credentials, keep `SMTP_MOCK=true`. Set it to `false` and fill `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` for live delivery.

## Skills

`.cursor/skills/` governs copy, HTML, compliance, dashboard sync, and this UI.

## CLI (still available)

```bash
npm run dry-run
npm run start:worker
npm run test:dashboard
```
