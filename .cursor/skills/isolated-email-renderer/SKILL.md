---
name: isolated-email-renderer
description: Securely and accurately renders raw HTML emails in React without CSS bleed.
---
# Isolated Email Renderer
## When to Use
- When building the React component that displays the generated AI email in the middle pane.

## Main Instructions
1. CSS Isolation Strategy: Do NOT use `dangerouslySetInnerHTML` directly in a standard `<div>`. Email HTML contains its own `<style>`, `<body>`, and background colors that will bleed into and break the Tailwind Next.js dashboard.
2. Implementation: Build an `EmailPreview` component that uses a sandboxed `<iframe>`. Pass the raw HTML string into the iframe using the `srcDoc` attribute.
3. Responsive Sizing: Use a responsive iframe wrapper that dynamically scales its height based on the email content, maintaining the soft gray background and centered white card we designed previously.
