---
name: compliance-and-dispatch
description: Handles SMTP dispatch, rate limiting, and email legal compliance.
---
# Compliance & Dispatch
## When to Use
- When writing the email sender, Nodemailer transport, and database logging modules.

## Main Instructions
1. Legal Compliance: Include a clear, professional "opt-out" mechanism in the footer.
2. Rate Limiting: Build a randomized jitter function that delays sends (e.g., 3 to 9 minutes between emails) to mimic human behavior and avoid spam filters.
3. State Logging: Prevent duplicate sends by tracking emailed leads in a local SQLite database or `campaign_state.json`.
