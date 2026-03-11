# SmartComparison-Tool

Real-time product comparison, price tracking, and deal detection platform.

## Architecture

The project has **three independent layers**, all communicating through the shared backend API:

```
SmartComparison-Tool/
├── backend/              # Fastify API server (shared by both clients)
├── web-app/              # SmartCompare Pro web application (React + Vite)
└── chrome-extension/     # Chrome Extension client (Manifest V3)
```

### Backend (`backend/`)
Fastify server providing REST APIs for product identification, price comparison, deal discovery, watchlists, notifications, and AI chat. Runs at `http://localhost:3001`.

### Web App (`web-app/`)
Full-featured React web application (formerly SmartCompare-Pro). Provides dashboard, search, deals, watchlist, pricing pages. Communicates with the backend via `/api/*` proxy.

### Chrome Extension (`chrome-extension/`)
Chrome Manifest V3 extension that detects products on e-commerce pages (Amazon, eBay, Walmart, Best Buy, Flipkart), extracts product info, and renders price comparison in a popup/side panel. Communicates with the same backend API.

## Quick Start

**Prerequisites:** Node.js 18+

```bash
# Install all dependencies
npm run install:all

# Start backend (terminal 1)
npm run dev:backend

# Start web app (terminal 2)
npm run dev:web-app

# Build extension (terminal 3)
npm run build:extension
# Then load chrome-extension/dist/ as unpacked extension in Chrome
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start backend server |
| `npm run dev:web-app` | Start web app dev server |
| `npm run dev:extension` | Build extension in watch mode |
| `npm run build:web-app` | Production build of web app |
| `npm run build:extension` | Production build of extension |
| `npm run install:all` | Install deps for all three layers |

## Environment Variables

See `backend/.env.example` for backend configuration.
See `web-app/.env` for web app configuration.
