# InferX Screenshots

This directory contains screenshots of the InferX application across different viewports.

## Screenshots to Capture

### Desktop (1440px width)

- `landing-desktop.png` — Homepage with hero, features, and CTA
- `marketplace-desktop.png` — Marketplace grid with filters
- `marketplace-detail-desktop.png` — Endpoint detail page
- `chat-desktop.png` — Chat interface with conversation sidebar
- `provider-dashboard-desktop.png` — Provider dashboard with charts
- `consumer-dashboard-desktop.png` — Consumer dashboard with spending analytics
- `analytics-desktop.png` — Platform-wide analytics
- `transactions-desktop.png` — Transaction history
- `settings-desktop.png` — Settings with wallet info

### Mobile (390px width, iPhone 14 Pro)

- `landing-mobile.png`
- `marketplace-mobile.png`
- `marketplace-detail-mobile.png`
- `chat-mobile.png`
- `provider-dashboard-mobile.png`
- `consumer-dashboard-mobile.png`
- `transactions-mobile.png`
- `settings-mobile.png`

### Tablet (768px width, iPad)

- `marketplace-tablet.png`
- `chat-tablet.png`

### Key UX Flows

- `wallet-connect-flow.png` — Freighter connection sequence
- `filter-flow.png` — Marketplace filters being applied
- `chat-flow.png` — Sending a message and receiving response
- `escrow-flow.png` — Payment held in escrow during inference

## How to Capture

### Using Chrome DevTools

1. Start local dev server: `cd apps/web && npm run dev`
2. Open http://localhost:3000
3. Press `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows) to toggle device mode
4. Select device or enter custom dimensions
5. Take screenshot via DevTools capture button or browser extension

### Using Puppeteer (optional, for automation)

```javascript
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: 'landing-desktop.png', fullPage: true });
  await browser.close();
})();
```

## Current Status

Screenshots need to be captured after the app is deployed to Vercel.
Until then, the screenshots are represented by ASCII diagrams in the main README.

## Design Specs

- Background color: `zinc-950` (very dark gray, almost black)
- Primary accent: `cyan-400` to `cyan-500`
- Secondary accent: `purple-500` to `purple-600`
- Glassmorphism: `backdrop-blur-xl bg-white/5 border border-white/10`
- Font: Inter (via `next/font/google`)
