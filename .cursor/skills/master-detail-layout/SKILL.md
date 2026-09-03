---
name: master-detail-layout
description: Governs the Next.js page layout to create a split-screen email client interface.
---
# Master-Detail Layout
## When to Use
- When refactoring the main dashboard layout in `/app/page.tsx`.

## Main Instructions
1. Layout Structure: Implement a CSS Grid or Flexbox layout. 
   - Left Pane (30-40% width): A scrollable list of leads (cards showing Company Name, Status, and a snippet of the generated subject line).
   - Middle/Main Pane (60-70% width): The detail view. If no lead is selected, show a minimalist empty state ("Select a lead to view"). If selected, display the full HTML email and a sticky action bar (Send, Edit, Regenerate).
2. State Management: Use React `useState` or URL Search Params (`?leadId=123`) to track the currently selected active lead. Ensure the left pane visually highlights the active lead card.
