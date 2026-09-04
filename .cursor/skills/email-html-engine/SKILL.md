---
name: email-html-engine
description: Governs the HTML/CSS template structure for outgoing emails, specifically injecting a cross-client compatible grayish line background pattern.
---
# Email HTML Engine
## When to Use
- When building the HTML wrapper string for the AI-generated email payload (e.g., in `/lib/ai.ts` or `/lib/template.ts`).

## Main Instructions
1. Dashboard UI Separation: NEVER apply background patterns to the Next.js React components. Patterns belong exclusively in the outgoing email HTML string.
2. Pattern Design (Data URI): Use a Base64-encoded SVG inline directly in the CSS of the email's outermost `<table>`. Generate a subtle diagonal line or intersecting line pattern. Use a soft off-white base (`#fafafa`) with faint grayish lines (`#e5e7eb` or `#d1d5db`).
3. Cross-Client Compatibility: 
   - Wrap the email in a 100% width `<table>` with the inline SVG background.
   - Outlook Fallback: Use Outlook conditional comments (`<!--[if mso]>`) to provide a solid `bgcolor="#fafafa"` fallback for the outer wrapper, as older Outlook versions drop CSS backgrounds.
4. Content Container: The inner `<table>` (holding the JR Intelligence text and bullet points) must be constrained to 600px wide, featuring a solid white (`#ffffff`) background, a subtle border, and rounded corners to stand out cleanly against the line pattern.
