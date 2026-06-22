# Full Stack Dish Dashboard — Ideation & Workflow

> Dry ideation captured before writing code. This is the reasoning that drives the
> architecture decisions in this repo.

## What the problem is really asking

At its core this is a small full-stack CRUD-ish app, but the *interesting* part — the
part actually being tested — isn't the CRUD. It's the **bonus**: real-time sync where
the dashboard reacts to a database change that did **not** originate from the dashboard.
That single requirement drives most of the architecture decisions.

Mental split:
- **The obvious 80%** — DB + fetch API + toggle API + React grid.
- **The differentiating 20%** — real-time propagation of *out-of-band* changes.

## The four building blocks

1. **Database** — 4 fields only: `dishId` (unique), `dishName` (string),
   `imageUrl` (string), `isPublished` (boolean). Seed from JSON. The DB choice is the
   most consequential decision *because of the bonus*.
2. **API** — `GET /dishes` (list) and a toggle endpoint for `isPublished`.
3. **Front-end** — fetch + render grid, per-dish toggle (optimistic update + rollback).
4. **Real-time (the bonus, the real test)** — dashboard must react to a direct DB edit
   with no manual refresh.

## The central design decision: hearing about out-of-band changes

| Approach | How it works | Trade-off |
|---|---|---|
| **A. Polling** | Frontend re-fetches every N s | Trivial, works with any DB, but laggy/wasteful |
| **B. App-emitted WS** | Backend pushes only when *its own* endpoint runs | **Misses the point** — a direct DB edit never hits the API |
| **C. DB-native change stream** | DB notifies backend of *any* change | True real-time even for out-of-band edits — the only approach that honestly satisfies the bonus |

**Chosen: C, with B's path collapsed into it.** The toggle endpoint just writes to the
DB; the change stream picks that up and broadcasts — so dashboard-driven and direct-DB
changes flow through the *exact same path*. One code path, two triggers.

## Data flow

```
                    +--------------+
   GET /dishes ---> |              |
   PATCH toggle --> |   Backend    | --> write --> +----------+
                    |  (API + WS)  |               |  MongoDB |
   WS push    <---- |              | <- change --- | (stream) |
                    +--------------+    stream     +----------+
                          ^                              ^
                          |                              |
                    React dashboard            direct DB edit (bonus)
                    (open, listening)          bypasses the API
```

Both the toggle button and the direct DB edit end up at the DB, and both are heard via
the change stream — so the dashboard updates identically regardless of source.

## Build order

1. Get/define the seed JSON, inspect its real shape.
2. Lock the stack + real-time strategy (it constrains DB choice).
3. DB + idempotent seed script.
4. REST endpoints; test with curl before any UI.
5. Wire the change stream -> broadcast over WebSocket.
6. React dashboard: fetch + render + optimistic toggle.
7. Connect the socket; patch affected dish in state (not a full refetch).
8. Prove the bonus: edit a row directly in the DB, watch it flip live.
9. Polish: loading/empty/error, env config, README, CORS.
10. Record the two 1-min videos + package.

## Risks / gotchas (and how this repo handles them)

- **Change Streams need a replica set** — standalone `mongod` breaks them.
  *Handled:* automatic fallback to backend polling if the change stream can't start, so
  the bonus works on any Mongo. docker-compose also ships a single-node replica set.
- **Toggle race condition** — *Handled:* atomic aggregation-pipeline update
  (`$set isPublished = $not isPublished`), no read-then-write window.
- **WebSocket reconnection** — *Handled:* Socket.IO auto-reconnect + refetch on reconnect.
- **Optimistic update rollback** — *Handled:* revert UI state if the API call fails.
- **CORS / env** — *Handled:* configurable origins + `.env.example` files.
- **Demo legibility** — the bonus only impresses if the video clearly shows the change
  happening *in the DB*. Plan the recording around that side-by-side shot.

## Stack chosen

Node + Express + MongoDB + Socket.IO (server) · React + Vite (client). MongoDB picked
specifically so Change Streams give a clean, honest demonstration of the bonus.
