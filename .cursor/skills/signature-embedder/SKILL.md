---
name: signature-embedder
description: Appends the custom JR image signature to the bottom of generated HTML emails using Nodemailer CID attachments.
---
# Signature Embedder
## When to Use
- When updating the HTML template compiler and the Nodemailer dispatch logic.

## Main Instructions
1. Asset Placement: Ensure the provided "image_029d84.jpg" file is stored in a secure local directory (e.g., `/public/assets/` or `/src/assets/`).
2. HTML Structure: In the HTML template generator, append a sign-off block below the CTA. It should read:
   "Best regards,<br><br>Rik & Julius<br>JR Intelligence"
   Immediately below this text, insert an `<img>` tag for the signature.
3. Deliverability (CID Method): Do NOT use raw Base64 strings for the image `src`, as this often triggers spam filters. Instead, configure the `<img>` tag with a Content-ID: `<img src="cid:jrsignature" alt="JR Signature" width="150" style="display:block; margin-top:10px;">`.
4. Nodemailer Configuration: When the SMTP dispatcher (`/lib/mailer.ts`) sends the email, it MUST attach "image_029d84.jpg" to the payload and assign it the `cid: 'jrsignature'` property so the HTML renders it inline perfectly.
