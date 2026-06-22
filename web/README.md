# 🌐 METNMAT Kitchen — Public Menu Website

The customer-facing restaurant website (Next.js 14, App Router). Shows only **published**
dishes, lets customers **order food**, **book a table**, and **check out** (with a demo
payment), and updates **live** when staff publish/unpublish from the CMS.

> 🔗 **Live:** https://web-kitchen-sigma.vercel.app

## Description
This is the public storefront. It reads from the same API server (`/server`) as the CMS,
so the menu is always in sync. Pages are server-rendered with ISR for speed + SEO, and a
thin client layer connects to Socket.IO for real-time menu refreshes.

## Features
- 🍽️ **Menu** — responsive grid of published dishes with image, price, description.
- 🔎 Debounced **search** with shareable URL query.
- 🛒 **Order food** — add to cart, cart drawer (qty / remove), checkout with
  delivery / pickup / dine-in, server-computed subtotal + 5% tax + delivery.
- 💳 **Payment** — cash on delivery or **demo card** (clearly labelled, no real charge;
  structured to drop in Stripe/Razorpay later).
- ✅ **Order confirmation** page with full receipt.
- 🪑 **Book a table** — reservation form (date / time / party size / notes).
- 🟢 **Real-time** — publishing a dish in the CMS appears here instantly.
- 🔍 **SEO** — per-page metadata, OpenGraph/Twitter, JSON-LD (`Restaurant` / `MenuItem`),
  `sitemap.xml`, `robots.txt`.
- 🎨 METNMAT dark-first theme; light/dark toggle; `next/image` optimization; a11y +
  reduced-motion support.

## Tech stack
Next.js 14 (App Router) · React 18 · `socket.io-client` · `next/font` · `next/image`.
Plain CSS design tokens (no Tailwind).

## Setup
```bash
cd web
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```
Requires the API server running (see `/server`).

## Environment (`.env.local`)
| Var | Default | Purpose |
|-----|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API base (ISR fetch + client) |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | Socket.IO server |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical/SEO/sitemap base |

## Routes
| Path | Type | Description |
|------|------|-------------|
| `/` | Static (ISR) | Menu + search |
| `/dish/[dishId]` | Dynamic | Dish detail + SEO + add to cart |
| `/checkout` | Client | Order details + payment |
| `/order/[orderNumber]` | Dynamic | Order confirmation |
| `/reserve` | Client | Table booking |
| `/about` · `/sitemap.xml` · `/robots.txt` | — | Info + SEO |

## Scripts
```bash
npm run dev       # dev server (port 3000)
npm run build     # production build
npm start         # serve the build
npm run lint      # next lint
```

## Deployment to Vercel (production)
Next.js is Vercel's native framework — ideal here.
1. Vercel → **New Project** → import the repo (under the `ajaykumarsaini` account).
2. **Root Directory:** `web`
3. Framework preset: **Next.js** (auto-detected).
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = deployed API URL (e.g. `https://metnmat-api.onrender.com`)
   - `NEXT_PUBLIC_SOCKET_URL` = same as above
   - `NEXT_PUBLIC_SITE_URL` = the site's own Vercel URL (e.g. `https://metnmat-kitchen.vercel.app`)
5. Deploy → live at `https://<project>.vercel.app`.
6. Add that URL to the **server's `CLIENT_ORIGIN`** allowlist so the browser's
   Socket.IO / fetch calls pass CORS.

> Images use `next/image` with `images.unsplash.com` + `placehold.co` allowed in
> `next.config.mjs` — add any new image hosts there before using them.
