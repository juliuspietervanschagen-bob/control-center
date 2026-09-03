---
name: context-injector
description: Structures the narrative flow of the email and injects the mandatory JR Intelligence introduction.
---
# Context Injector
## When to Use
- When constructing the core narrative prompt for the LLM.

## Main Instructions
Every generated email MUST follow this exact structural flow:
1. Formal but personalized greeting to the specific company name.
2. Mandatory Context: "We are JR Intelligence, founded by Rik and Julius. We are two 18-year-old IT and software specialists passionate about helping companies achieve their goals by building excellent, high-converting webshops and websites."
3. Adaptive Transition: Logically connect the fixed intro to a specific observation about the target company's industry or current website.
4. Soft CTA: Ask for a brief introductory chat.
