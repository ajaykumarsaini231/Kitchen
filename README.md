# 🍽️ METNMAT Kitchen — Full-Stack Restaurant System

A real-time restaurant platform in **three apps sharing one database**: a public menu &
ordering website, an admin CMS, and an Express + Socket.IO API.

## 🔗 Live
| App | What it is | URL |
|-----|------------|-----|
| 🌐 **Public menu** (`web/`) | Customer site — menu, cart, checkout, table booking | **https://web-kitchen-sigma.vercel.app** |
| 🛠️ **Admin CMS** (`client/`) | Staff dashboard — publish, add products | **https://cms-kitchen.vercel.app** |
| ⚙️ **API server** (`server/`) | REST + WebSocket backend (on Render) | **https://kitchen-oayb.onrender.com** |

> ℹ️ **Hosting note:** Frontends run on **Vercel**; the **API runs on Render**
> (`https://kitchen-oayb.onrender.com`) so its WebSocket + MongoDB change streams stay
> alive (Vercel serverless can't keep them open). _Render free tier sleeps after ~15 min
> idle, so the first request can take ~30–50s to wake._

---

## What it does
- **Customers** browse a 128-dish menu, add to cart, check out (cash or demo card), and book a table.
- **Staff** log into the CMS to publish/unpublish dishes and add new products.
- **Everything is live** — a change in the CMS (or directly in the DB) instantly updates the public menu via WebSockets.

---

## 🧭 Architecture
```mermaid
flowchart LR
  Customer([👤 Customer]) -->|browse / order| Web["🌐 web/ — Next.js<br/>web-kitchen-sigma.vercel.app"]
  Admin([Staff]) -->|manage menu| CMS["client/ — React + Vite<br/>cms-kitchen.vercel.app"]
  Web <-->|REST + WebSocket| API["⚙️ server/ — Express + Socket.IO<br/>kitchen-oayb.onrender.com"]
  CMS <-->|REST + WebSocket| API
  API -->|Mongoose| DB[("🍃 MongoDB Atlas")]
  DB -. change streams .-> API
  API -. dish:updated / order:new .-> Web
  API -. dish:updated / order:new .-> CMS
```

## 🔄 Real-time sync flow
```mermaid
sequenceDiagram
  participant A as Admin (CMS)
  participant S as API + Socket.IO
  participant DB as MongoDB
  participant C as Customer (Web)
  A->>S: PATCH /api/dishes/:id/toggle
  S->>DB: update isPublished
  DB-->>S: change stream event
  S-->>C: emit "dish:updated"
  S-->>A: emit "dish:updated"
  C->>C: menu refreshes instantly (no reload)
```

## 🛒 Order flow
```mermaid
sequenceDiagram
  participant C as Customer (Web)
  participant S as API
  participant DB as MongoDB
  C->>C: Add to cart → Checkout
  C->>S: POST /api/orders (items, customer, payment)
  S->>DB: re-price server-side, save Order
  S-->>S: emit "order:new" (to admins)
  S-->>C: 201 { orderNumber, total }
  C->>C: Order confirmation page
```
> Diagrams are [Mermaid](https://mermaid.js.org/) — GitHub renders them automatically, no external tool needed.

---

## 📦 The three apps
| Folder | Stack | README |
|--------|-------|--------|
| `server/` | Node, Express, MongoDB, Socket.IO, JWT, Zod, Swagger | [server/README.md](server/README.md) |
| `client/` | React 18, Vite, socket.io-client | [client/README.md](client/README.md) |
| `web/` | Next.js 14 (App Router), socket.io-client | [web/README.md](web/README.md) |

## 🚀 Quick start (local)
Run each in its own terminal (PowerShell-friendly — no `&&`):
```powershell
cd server ; node src\index.js     # API  → http://localhost:4000  (auto-seeds 128 dishes + users)
cd client ; npm run dev            # CMS  → http://localhost:5173
cd web ; npm run dev               # Menu → http://localhost:3000
```
> No MongoDB? Leave `server/.env`'s `MONGODB_URI` empty — the server auto-starts an
> in-memory MongoDB and seeds everything.

### Demo accounts
| Role | Email | Password |
|------|-------|----------|
| admin | `admin@metnmat.com` | `admin123` |
| viewer | `viewer@metnmat.com` | `viewer123` |

## ☁️ Production wiring
The apps are wired together with these env vars:
- **web-kitchen** (Vercel) → `NEXT_PUBLIC_API_URL` & `NEXT_PUBLIC_SOCKET_URL` = `https://kitchen-oayb.onrender.com`, `NEXT_PUBLIC_SITE_URL` = `https://web-kitchen-sigma.vercel.app`
- **cms-kitchen** (Vercel) → `VITE_API_URL` = `https://kitchen-oayb.onrender.com`
- **API** (Render) → `MONGODB_URI` (Atlas, Network Access `0.0.0.0/0`), `JWT_SECRET`, and `CLIENT_ORIGIN` = `https://web-kitchen-sigma.vercel.app,https://cms-kitchen.vercel.app`

## 🗂️ Repo structure
```
.
├─ server/   # Express + MongoDB + Socket.IO API (auth, orders, reservations, realtime)
├─ client/   # React + Vite admin CMS (publish, add product)
├─ web/      # Next.js public menu (cart, checkout, booking, SEO)
├─ IDEATION.md
└─ docker-compose.yml
```

## Tech highlights
JWT auth + roles · Zod validation · Swagger docs (`/api/docs`) · MongoDB change streams →
Socket.IO · in-memory DB fallback · Vitest tests · METNMAT dark theme (OKLCH, Space
Grotesk / Inter / JetBrains Mono) · `next/image` + SEO (JSON-LD, sitemap, robots).
