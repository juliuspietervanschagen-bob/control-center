---
name: ai-email-generation
description: Governs the new, concise, bulleted LLM prompting and email creation logic.
---
# AI Email Generation
## When to Use
- When updating the LLM system prompt in `/lib/ai.ts`.

## Main Instructions
1. Length Constraint: The email must be 15% shorter than previous iterations. Target roughly 85 to 150 words maximum. Be punchy, direct, and respect the reader's time.
2. Structural Flow: Every generated email MUST follow this exact sequence:
   - Formal Greeting.
   - Mandatory Intro: "We are JR Intelligence, founded by Rik and Julius. We are two 18-year-old IT and software specialists passionate about helping companies achieve their goals by building excellent, high-converting webshops and websites."
   - The Audit (3 Bullet Points): Using the scraped Markdown data, list 3 specific, constructive observations about their current webshop (e.g., UI/UX friction, missing clear CTAs, outdated design, or lack of mobile optimization).
   - The Solution: Write a concise paragraph immediately following the bullets explaining exactly how JR Intelligence can improve those specific points to drive more conversions/sales.
   - Soft CTA: Propose a quick, low-friction chat.
3. Formatting: Output the email as a sleek, inlined HTML template. Use `<ul>` and `<li>` tags for the bullet points. Ensure the ultra-subtle minimalist geometric background is maintained.
