---
name: full-stack-architect
description: UI/UX and architectural guidelines for the Next.js control panel.
---
# Full Stack Architect
## When to Use
- When scaffolding the Next.js app, UI components, and API routes.

## Main Instructions
1. Tech Stack: Use Next.js (App Router), TypeScript, Tailwind CSS, and Shadcn UI.
2. UI/UX Aesthetic: Strictly enforce a high-end minimalist design. Use a monochrome color palette (whites, light grays, dark grays, black text), generous whitespace, crisp typography (e.g., Inter or Geist), thin borders, and subtle, snappy hover states. Avoid unnecessary colors, heavy shadows, or cluttered layouts.
3. Layout: Follow `.cursor/skills/master-detail-layout/SKILL.md`. The Control Center is a split email client: lead list on the left, isolated HTML preview in the main pane. Do not use pop-up modals or extra pages for review.
4. Interaction: Click a lead to open it in the main pane. Render HTML only through the sandboxed `EmailPreview` iframe. Edit, regenerate, and send from a sticky action bar.
