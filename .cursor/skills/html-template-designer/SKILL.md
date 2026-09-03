---
name: html-template-designer
description: Generates the HTML/CSS email structure with embedded geometric backgrounds.
---
# HTML Template Designer
## When to Use
- When building the email rendering engine or testing UI.

## Main Instructions
1. Build a sleek, lightweight HTML/CSS generator using standard `<table>` layouts for maximum compatibility (Outlook, Gmail, Apple Mail).
2. Background Pattern: Follow `.cursor/skills/email-ui-architect/SKILL.md`. Apply a URL-encoded SVG dot grid to the 100% wrapper only (`#fafafa` base, `#e5e7eb` dots). Do not host the pattern remotely.
3. Contrast: The inner 600px card stays solid `#ffffff` with `#1f2937` text. Outlook fallback is `bgcolor="#fafafa"` plus MSO ghost tables.
4. CSS must be strictly inlined (e.g., using a library like `juice`). Use single-quoted `url('data:...')` values so inline `style=""` attributes stay valid.
