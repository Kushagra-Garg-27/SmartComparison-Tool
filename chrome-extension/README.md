# SmartCompare Pro — Chrome Extension

Browser extension client for SmartCompare. Detects products on e-commerce pages and provides real-time price comparison.

## Supported Platforms

- Amazon (US, IN, UK)
- eBay
- Walmart
- Best Buy
- Flipkart
- Any site with JSON-LD Product markup

## Architecture

```
chrome-extension/
├── manifest.json          # Chrome Extension Manifest V3
├── popup.html             # Popup UI entry
├── panel.html             # Side Panel UI entry
├── build.mjs              # esbuild build script
├── package.json
├── tsconfig.json
└── src/
    ├── background.ts      # Service worker — API proxy & state management
    ├── content.ts          # Content script — product detection & badge injection
    ├── popup.ts            # Popup UI — quick summary & actions
    ├── panel.ts            # Side Panel UI — full comparison view
    ├── types.ts            # Shared type definitions
    ├── detectors/
    │   └── index.ts        # Platform-specific product detectors
    ├── services/
    │   └── backendApi.ts   # Backend API client (used by background worker)
    └── styles/
        ├── popup.css
        └── panel.css
```

## Development

```bash
# Install dependencies
npm install

# Build (one-shot)
npm run build

# Build (watch mode)
npm run dev

# Type-check
npm run typecheck
```

## Loading in Chrome

1. Run `npm run build` to generate `dist/`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select the `dist/` folder
5. Navigate to any supported product page

## Communication Flow

```
Content Script (detects product on page)
  → sends PRODUCT_DETECTED to Background
Background Service Worker
  → stores in chrome.storage.local
  → proxies API calls to Backend (http://localhost:3001)
Popup / Side Panel
  → reads detected product from Background
  → requests identification, comparison, price history
  → renders deal comparison UI
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/product/identify` | Resolve product → canonical + listings |
| POST | `/api/product/compare` | Cross-platform price comparison |
| GET | `/api/product/history` | Price history for charts |
| GET | `/health` | Backend health check |

All endpoints are served by the shared `backend/` service.
