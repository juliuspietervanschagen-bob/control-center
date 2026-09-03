---
name: dashboard-sync-engine
description: Manages active, bidirectional syncing with the external lead dashboard.
---
# Dashboard Sync Engine
## When to Use
- When writing backend API routes or server actions to fetch/update leads.

## Main Instructions
1. Pull Functionality: Create an API utility to fetch new leads from the external dashboard's REST API, securely using a `.env` API key.
2. Push Functionality: Once an email is sent from our platform, immediately push an update (e.g., `PATCH`) back to the external dashboard changing the lead status to "CONTACTED".
3. Database: Use a lightweight local database (SQLite + Prisma) to cache the leads and their email drafts so the platform remains fast and responsive.
