---
name: queue-worker-manager
description: Governs the background polling mechanism, rate limiting, and error handling.
---
# Queue Worker Manager
## When to Use
- When building the background daemon/worker that runs the email agent continuously.

## Main Instructions
1. Polling Daemon: Use a library like `node-cron` or a `setInterval` loop to check the dashboard for new leads every 10-15 minutes.
2. Concurrency Control: Process leads sequentially (one by one), applying the 3 to 9-minute randomized jitter delay between sends to prevent SMTP spam flags.
3. Idempotency (No Duplicates): Maintain a lightweight local cache (e.g., a `Set` of processed lead IDs in memory or a quick SQLite check) to guarantee a lead is NEVER emailed twice, even if the dashboard API is slow to update.
4. Error Handling: If the LLM fails or the email bounces, update the dashboard status to `FAILED` with an error reason, and move to the next lead without crashing the worker.
