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
3. Layout: Build a clean "Control Center". The main view should be a minimalist Data Table or Kanban board showing leads in three stages: "Pending Generation", "Ready for Review", and "Sent".
4. Interaction: Users must be able to click a lead, trigger the AI email generation, preview/edit the text in a clean rich-text modal, and hit "Send".
