---
name: smtp-dispatcher
description: Handles the actual sending of emails to clients.
---
# SMTP Dispatcher
## When to Use
- When building the email sending API route.

## Main Instructions
1. Integration: Use Nodemailer. Authenticate using secure `.env` variables.
2. Dispatch: Take the approved HTML email from the frontend and send it to the client's email address.
3. Legal Compliance: Include a standard, unobtrusive B2B opt-out link in the footer.
4. Error Handling: Return clear, minimalist error toasts to the UI if the SMTP server rejects the email.
