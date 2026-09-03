---
name: ai-email-generation
description: Governs the LLM prompting and email creation logic.
---
# AI Email Generation
## When to Use
- When building the Next.js API route that generates the email content.

## Main Instructions
1. Bilingual & Human Tone: English or Dutch only. Strictly 100-200 words. Flawless grammar. Exclude all robotic words (e.g., "delve", "seamless", "tapestry").
2. Mandatory Intro: After a formal greeting, insert EXACTLY: "We are JR Intelligence, founded by Rik and Julius. We are two 18-year-old IT and software specialists passionate about helping companies achieve their goals by building excellent, high-converting webshops and websites."
3. HTML Wrapping: Compile the generated text into an inlined HTML template with an ultra-subtle, low-contrast geometric background pattern (e.g., faint gray dots on white) so it aligns with the minimalist brand identity.
