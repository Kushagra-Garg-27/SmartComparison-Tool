# SmartCompare Backend

API server powering the SmartCompare browser extension comparison engine.

## Quick Start

```bash
cd backend
npm install
npm run dev
```

The server starts at `http://localhost:3001` with an in-memory store (no database required).

## API Endpoints

| Method | Path                                 | Description                                     |
| ------ | ------------------------------------ | ----------------------------------------------- |
| `GET`  | `/health`                            | Health check                                    |
| `POST` | `/api/product/identify`              | Resolve detected product → canonical + listings |
| `POST` | `/api/product/compare`               | Cross-platform price comparison                 |
| `GET`  | `/api/product/history?productId=...` | Price history for charts                        |

## Architecture

```
Content Script → Background Worker → Backend API → Data Store
```

- **In-memory store** (default): No setup required, data lives in process memory
- **PostgreSQL**: Set `USE_MEMORY_STORE=false` and provide `DATABASE_URL` in `.env`

## Database Setup (Optional)

```bash
# Create the database
createdb smartcompare

# Run schema migration
npm run db:init
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable           | Default            | Description                               |
| ------------------ | ------------------ | ----------------------------------------- |
| `PORT`             | `3001`             | Server port                               |
| `HOST`             | `0.0.0.0`          | Bind address                              |
| `USE_MEMORY_STORE` | `true`             | Use in-memory store instead of PostgreSQL |
| `DATABASE_URL`     | `postgresql://...` | PostgreSQL connection string              |
