# 🛠️ METNMAT Kitchen — Admin CMS Dashboard

A React + Vite admin dashboard for managing the restaurant menu. Staff log in, see every
dish, **publish/unpublish** them, **add new products**, and watch changes appear in
**real time** — including edits made directly in the database.

> 🔗 **Live:** https://cms-kitchen.vercel.app

## Description
This is the private management side of the system. It talks to the API server (`/server`)
over HTTP (with a JWT) and over a Socket.IO connection for live updates. The public menu
site (`/web`) reflects whatever is published here, instantly.

## Features
- 🔐 **Login-gated** with `admin` / `viewer` roles; viewers are read-only.
- ✅ **Publish / Unpublish** toggle per dish (optimistic UI + rollback).
- ➕ **Add Product** modal — name, price, image URL, description, publish toggle.
  _(No delete button by design.)_
- 🔎 Debounced **search** + **All / Published / Unpublished** filters.
- 🟢 **Real-time**: reacts to `dish:updated` / `dishes:resync` from the API; a brief
  highlight animation marks live changes.
- ⚡ **Simulate backend change** button to demo the real-time path on screen.
- 🎨 METNMAT dark-first theme (OKLCH tokens, Space Grotesk / Inter / JetBrains Mono),
  light/dark toggle, `sonner` toasts, loading skeletons.

## Tech stack
React 18 · Vite 5 · `socket.io-client` · `sonner`. Plain CSS design tokens (no Tailwind).

## Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```
Requires the API server running (see `/server`). Log in with the seeded accounts:

| Role | Email | Password | Can edit? |
|------|-------|----------|-----------|
| admin | `admin@metnmat.com` | `admin123` | ✅ |
| viewer | `viewer@metnmat.com` | `viewer123` | ❌ read-only |

## Environment (`.env`)
| Var | Default | Purpose |
|-----|---------|---------|
| `VITE_API_URL` | `http://localhost:4000` | API / WebSocket base URL |

## Scripts
```bash
npm run dev       # dev server (port 5173)
npm run build     # production build -> dist/
npm run preview   # preview the build
```

## Deployment to Vercel (production)
The CMS is a static SPA — perfect for Vercel.
1. Vercel → **New Project** → import the repo.
2. **Root Directory:** `client`
3. Framework preset: **Vite** (Build `npm run build`, Output `dist`).
4. **Environment Variable:** `VITE_API_URL` = your deployed API URL (the Render/Railway
   server, e.g. `https://metnmat-api.onrender.com`).
5. Deploy. Add the resulting Vercel URL to the server's `CLIENT_ORIGIN` allowlist.

> SPA routing is handled by Vite's single `index.html`; no extra rewrites needed for this
> app. Build the project under the `ajaykumarsaini` Vercel account and it will be live at
> `https://<project>.vercel.app`.
