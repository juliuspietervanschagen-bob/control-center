---
name: website-analyzer-engine
description: Extracts clean Markdown from the target client's website using an LLM-optimized API for deep personalization.
---
# Website Analyzer Engine
## When to Use
- When writing the lead enrichment pipeline in `/lib/scraper.ts` before calling the LLM.

## Main Instructions
1. Architecture: Do NOT use heavy dependencies like Puppeteer, and avoid Cheerio as it fails on modern JavaScript webshops. 
2. Implementation: Build a lightweight fetch function that calls `https://r.jina.ai/[TARGET_URL]`. This free API bypasses blocks and returns the website's content as clean Markdown.
3. Data Extraction: Pass the returned Markdown to the LLM so it can understand the company's core offering, identify missing features, and evaluate their current webshop structure.
4. Fallback Logic: If the API times out, gracefully fallback to generating insights based purely on their Industry and Company Name.
