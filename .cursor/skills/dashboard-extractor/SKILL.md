---
name: dashboard-extractor
description: Manages the extraction of leads from the external dashboard and syncing of campaign states.
---
# Dashboard Extractor
## When to Use
- When writing the API client that interacts with the custom dashboard.

## Main Instructions
1. Extraction Logic: Build a robust HTTP client (e.g., using `axios` or native `fetch`) to query the dashboard's API for "Pending" or "Uncontacted" leads. 
2. Type Safety: Create strict TypeScript interfaces for the expected Dashboard Lead payload (e.g., `id`, `company_name`, `email`, `industry`).
3. State Syncing: After an email is dispatched, immediately send a `PATCH` or `PUT` request back to the dashboard to update the lead's status to `CONTACTED`, logging the timestamp and the exact generated subject line.
4. Authentication: Secure the connection using a `DASHBOARD_API_KEY` or Bearer token stored in `.env`.
