# 🍽️ Dish Dashboard — Full Stack (METNMAT)

Manage and display dish information: a MongoDB database, an Express + Socket.IO API
with JWT auth, and a branded React dashboard that toggles published status **and
reflects real-time changes made directly in the database** (the bonus).

See [IDEATION.md](IDEATION.md) for the design reasoning.

## Architecture

```
React (Vite)  --HTTP(+JWT)-->  Express API  --writes-->  MongoDB
     ^                              |                       |
     |                              | change stream / poll  |
     +-------- Socket.IO -----------+ <---------------------+
```

## Features

**Core (assignment)**
- Schema: `dishId`, `dishName`, `imageUrl`, `isPublished`; seeded from JSON.
- `GET /api/dishes` (public) and an **atomic** publish toggle.
- React dashboard with optimistic toggle + rollback.
- **Bonus real-time:** MongoDB change streams broadcast every change (including
  direct DB edits) over WebSocket; automatic polling fallback if no replica set.

**Production add-ons**
- 🔐 **Auth:** JWT login with `admin` / `viewer` roles. Mutations are admin-only;
  `GET` stays public. Dashboard is gated behind login; viewers are read-only.
- 🛡️ **Security:** `helmet`, rate limiting, `compression`, Zod validation, consistent
  `{ error, code }` envelope, CORS allowlist.
- 📊 **Observability:** structured `pino` logging, `/api/health` + `/api/ready`.
- 🎨 **UX:** METNMAT dark-first theme (OKLCH, Space Grotesk/Inter/JetBrains Mono),
  debounced search, All/Published/Unpublished filters, `sonner` toasts, loading
  skeletons, real-time update flash, light/dark toggle.
- 🧪 **Tests:** Vitest + supertest over an in-memory MongoDB (`npm test`).
- 🔁 **API versioning:** every route also available under `/api/v1/*`.

## Prerequisites
- Node.js 18+
- MongoDB is **optional for local dev** — if `MONGODB_URI` is unset, the server boots
  an **in-memory replica set** automatically (no Docker / install needed) and auto-seeds.
  Set `MONGODB_URI` (e.g. Atlas) for persistent data.

## Setup

### Backend
```bash
cd server
cp .env.example .env      # optional; defaults work out of the box
npm install
npm run dev               # http://localhost:4000  (auto-seeds dishes + users)
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### Demo accounts (seeded automatically)
| Role | Email | Password | Can toggle? |
|------|-------|----------|-------------|
| admin | `admin@metnmat.com` | `admin123` | ✅ |
| viewer | `viewer@metnmat.com` | `viewer123` | ❌ (read-only) |

> Change these via `ADMIN_*` / `VIEWER_*` env vars before deploying.

## Trying the real-time bonus (out-of-band change)
With the dashboard open, change a dish **without using the UI** — three ways:

1. **CLI** (needs `MONGODB_URI` pointing at the same DB the server uses):
   ```bash
   cd server
   npm run toggle -- 1
   ```
2. **In-app demo button:** click **⚡ Simulate backend change** (calls a dedicated
   server endpoint that writes straight to the DB).
3. **Directly in MongoDB Atlas / Compass:** edit a dish's `isPublished`.

In all cases the dashboard updates **instantly** with a brief highlight — proof the
change stream → WebSocket path works regardless of where the change originated.

## Tests
```bash
cd server
npm test        # auth, roles, validation, public GET, toggle, simulate, 404
```

## API
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dishes` | public | List dishes. Opt-in `?page&limit&sort&order&published&q` |
| POST | `/api/dishes` | admin | Create a dish |
| PATCH | `/api/dishes/:dishId/toggle` | admin | Flip `isPublished` |
| PATCH | `/api/dishes/:dishId` | admin | Set `isPublished` (body `{isPublished}`) |
| PUT | `/api/dishes/:dishId` | admin | Update name/image/published |
| DELETE | `/api/dishes/:dishId` | admin | Soft-delete |
| POST | `/api/dishes/:dishId/simulate-external` | public | Demo out-of-band flip |
| POST | `/api/auth/login` | public | `{ token, user }` |
| GET | `/api/auth/me` | bearer | Current user |
| GET | `/api/health`, `/api/ready` | public | Probes |

All routes are also mounted under `/api/v1/*`.
**Interactive API docs (Swagger UI):** http://localhost:4000/api/docs

## Lint & format
```bash
cd server
npm run lint      # eslint
npm run format    # prettier --write
```

## Docker (full stack)
> Untested in the author's environment (no Docker installed) but provided ready-to-run.
```bash
docker compose up --build
# client -> http://localhost:8080   api -> http://localhost:4000
```
The `mongo-init` service initialises the single-node replica set so change streams work.

## CI
[.github/workflows/ci.yml](.github/workflows/ci.yml) runs on push/PR: server `lint` + `test`,
and a client production `build`.

## Deployment
- **DB:** MongoDB Atlas (replica set → change streams work out of the box). Set `MONGODB_URI`.
- **Server:** Render / Railway / Fly. Set env vars (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`,
  `ADMIN_*`). Start command `npm start`; health check `/api/health`.
- **Client:** Vercel / Netlify. Build `npm run build`, output `dist`, env `VITE_API_URL`
  = your deployed API URL.

## Project structure
```
server/src/
  app.js          # express app (middleware, routes, error envelope) — importable by tests
  index.js        # bootstrap: DB + seed + socket + realtime + listen
  auth.js         # JWT sign/verify + requireAuth / requireRole
  validate.js     # Zod validation middleware
  logger.js       # pino
  realtime.js     # change stream + polling fallback
  models/         # Dish, User
  routes/         # dishes, auth
  seedData.js seedUsers.js memoryDb.js toggleCli.js
server/test/      # vitest + supertest
client/src/
  App.jsx api.js auth.js socket.js index.css
  components/      # DishCard, Skeleton, Login
```
