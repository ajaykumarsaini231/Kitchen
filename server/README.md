# 🍽️ METNMAT Kitchen — API Server

Node.js + Express + MongoDB (Mongoose) + Socket.IO backend powering the **CMS dashboard**
(`/client`) and the **public menu website** (`/web`). Provides the menu, JWT auth with
roles, ordering, table reservations, and **real-time updates** via MongoDB change streams.

## Description
This is the single source of truth for the whole system. It exposes a REST API and a
WebSocket channel. Any change to a dish (from the CMS **or** directly in the database) is
broadcast live to every connected client, so the public menu and the dashboard always
stay in sync.

## Features
- **Menu API** — list/search/paginate dishes; each dish has `dishName`, `imageUrl`,
  `description`, `price`, `isPublished`.
- **Auth** — JWT login with `admin` / `viewer` roles; mutations are admin-only, reads are public.
- **CRUD** — create / update / soft-delete dishes (admin). No hard delete.
- **Ordering** — place orders (server recomputes prices + tax + delivery), order lookup,
  admin order list & status updates.
- **Reservations** — table booking (public) + admin list & status updates.
- **Real-time** — MongoDB change streams → Socket.IO events `dish:updated`,
  `dishes:resync`, `order:new`, `reservation:new`. Polling fallback if no replica set.
- **Resilience** — auto-falls back to an in-memory MongoDB if the external DB is
  unreachable, so the server always starts.
- **Security** — `helmet`, rate limiting, `compression`, Zod validation, consistent
  `{ error, code }` envelope, CORS allowlist.
- **Observability** — structured `pino` logging, `/api/health` + `/api/ready` probes.
- **Docs** — Swagger UI at `/api/docs`. Tests with Vitest + supertest.

## Tech stack
Node 18+ · Express · Mongoose · Socket.IO · JWT (`jsonwebtoken`) · `bcryptjs` · Zod ·
`helmet` · `express-rate-limit` · `pino` · `swagger-ui-express` · Vitest.

## Setup
```bash
cd server
cp .env.example .env      # optional — sensible defaults included
npm install
npm run dev               # http://localhost:4000  (auto-seeds 128 dishes + users)
```
> No MongoDB installed? Leave `MONGODB_URI` empty — the server boots an in-memory
> replica set automatically and seeds everything. Set `MONGODB_URI` (e.g. Atlas) for
> persistent data.

## Environment (`.env`)
| Var | Default | Purpose |
|-----|---------|---------|
| `MONGODB_URI` | _(empty → in-memory)_ | MongoDB connection string |
| `PORT` | `4000` | API/WebSocket port |
| `CLIENT_ORIGIN` | `http://localhost:5173,http://localhost:3000` | CORS allowlist |
| `JWT_SECRET` | `dev-secret-change-me` | **change in production** |
| `JWT_EXPIRES` | `7d` | Token lifetime |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@metnmat.com` / `admin123` | Seeded admin |
| `VIEWER_EMAIL` / `VIEWER_PASSWORD` | `viewer@metnmat.com` / `viewer123` | Seeded viewer |
| `LOG_LEVEL` | `info` | pino level |

## Scripts
```bash
npm run dev      # watch mode
npm start        # production
npm run seed     # seed an external DB from data/dishes.json
npm run toggle -- <dishId>   # flip a dish directly in the DB (out-of-band demo)
npm test         # Vitest + supertest
npm run lint     # ESLint
```

## API
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dishes` | public | List dishes (`?published=&q=&page=&limit=&sort=&order=`) |
| GET | `/api/dishes/:id` | public | Single dish |
| POST | `/api/dishes` | admin | Create dish |
| PUT | `/api/dishes/:id` | admin | Update dish |
| PATCH | `/api/dishes/:id/toggle` | admin | Toggle published |
| PATCH | `/api/dishes/:id` | admin | Set `isPublished` |
| DELETE | `/api/dishes/:id` | admin | Soft delete |
| POST | `/api/orders` | public | Place an order |
| GET | `/api/orders` | admin | Recent orders |
| GET | `/api/orders/:orderNumber` | public | Order lookup |
| PATCH | `/api/orders/:orderNumber/status` | admin | Update order status |
| POST | `/api/reservations` | public | Book a table |
| GET | `/api/reservations` | admin | Recent reservations |
| POST | `/api/auth/login` | public | `{ token, user }` |
| GET | `/api/health`, `/api/ready` | public | Probes |

All routes are also mounted under `/api/v1/*`. Interactive docs: `/api/docs`.

## Deployment (production)
> ⚠️ **Vercel note:** Vercel is serverless and does **not** keep long-lived WebSocket /
> change-stream connections alive, so the **API server should NOT run on Vercel**. Host it
> on a persistent platform — **Render**, **Railway**, or **Fly.io** — and point the two
> frontends (which *do* go on Vercel) at it.

**Render / Railway:**
1. New Web Service → repo root, root directory `server`.
2. Build: `npm install` · Start: `npm start`.
3. Env vars: `MONGODB_URI` (Atlas, IP-allowlist `0.0.0.0/0`), `JWT_SECRET`,
   `CLIENT_ORIGIN` = your deployed CMS + web URLs (comma-separated), `ADMIN_*`.
4. Health check path: `/api/health`.

**Database:** MongoDB Atlas (replica set → change streams work out of the box).
After deploy, set the frontends' `VITE_API_URL` / `NEXT_PUBLIC_API_URL` to the server URL.
