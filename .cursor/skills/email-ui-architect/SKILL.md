---
name: email-ui-architect
description: Governs the HTML/CSS template structure, specifically injecting cross-client compatible subtle background patterns.
---
# Email UI Architect
## When to Use
- When building or updating the HTML email template compiler (e.g., in `/lib/ai.ts` or `/lib/template.ts`).

## Main Instructions
1. Pattern Design: Use a seamless, ultra-light geometric pattern (e.g., a minimal dot grid or faint diagonal hatch). 
2. Color Palette: The background base should be a soft off-white (e.g., `#fafafa` or `#fdfdfd`), and the pattern itself should be a very faint light gray (e.g., `#e5e7eb` or `#f3f4f6`) so it is barely perceptible but adds texture.
3. Implementation (Data URI): Do NOT link to externally hosted background images. Instead, use a URL-encoded SVG or Base64 SVG inline directly in the CSS (e.g., `background-image: url("data:image/svg+xml,...");`).
4. Structural Compatibility: 
   - Apply the background pattern to a 100% width `<table>` wrapper that centers the main email content body (which should sit on a solid `#ffffff` card with subtle padding).
   - Graceful Degradation for Outlook: Wrap the main content in standard Outlook conditional comments (`<!--[if mso]>`). Because older Outlook engines (Word HTML) struggle with CSS backgrounds, ensure the fallback `bgcolor` is set to a solid, comfortable light gray (e.g., `bgcolor="#fafafa"`) on the main table wrapper.
5. Legibility: Ensure the actual text container maintains a solid white background (`#ffffff`) with high-contrast text (`#1f2937`) to guarantee 100% readability.
