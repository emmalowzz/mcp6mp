# ActiveNutri

Singapore sports nutrition, recovery and venue-booking ecosystem — Vite + React 19 + TypeScript + Express + Tailwind CSS v4, linked to the Smithery MCP gateway.

Built from [`ACTIVENUTRI_MASTERPROMPT.md`](ACTIVENUTRI_MASTERPROMPT.md) and the team’s Miro Business Model Canvas ([`docs/miro-business-model-canvas.png`](docs/miro-business-model-canvas.png)). The canvas shaped the features (membership tiers, booking bot, Snap & Calculate, pod pickup, partner types); the board image is kept in `docs/` as the design artefact (template by Strategyzer AG, CC BY-SA 3.0). The **For Partners** screen is a single partner inquiry form.

## Run

```bash
npm install
npm run dev                          # http://localhost:3000 — Express + Vite middleware
npm run build && NODE_ENV=production npm start   # serves dist/
```

## API

| Route | Purpose |
|-------|---------|
| `GET/POST /api/health` | Smithery gateway reachability, latency, HTTP status, tools (4 s timeout; 200–499 = reachable) |
| `GET /api/mcp` | Tool manifest |
| `POST /api/mcp` | MCP JSON-RPC 2.0: `initialize`, `tools/list`, `tools/call` |
| `POST /api/tools` | Same handler as `/api/mcp`. This is the route the web app calls, so the front end never references MCP. |

The same handlers in `api/` run as Vercel functions and as Express routes (`server.ts`).

## Back-end MCP check

The MCP gateway check is back-end only; the website never calls it or mentions it.

```bash
npm run check:mcp                                   # probe the Smithery gateway directly from this machine
npm run check:mcp -- https://your-app.vercel.app    # ask a deployed server's /api/health
curl -s https://your-app.vercel.app/api/health      # raw JSON report
```

`check:mcp` exits with 0 when the gateway is reachable (any HTTP 200–499 response) and 1 otherwise, so it can run in CI or a cron job.

```bash
curl -s -X POST localhost:3000/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculate_recovery_macros","arguments":{"weight_kg":68,"duration_min":75,"intensity":"high"}}}'
```

## Meal photos

Each meal has a drawn illustration (`src/components/MealArt.tsx`), so the site needs no external image host. To use real photos instead:

1. Put the photos in `public/meals/`, e.g. `public/meals/sous-vide-salmon.jpg` (landscape, 4:3, at least 1200 px wide).
2. In `src/data/catalog.ts`, add `photo: '/meals/sous-vide-salmon.jpg'` to that meal.

The photo then replaces the illustration everywhere: menu cards, meal details, order pop-up, plan cards and pod stock lists.

## Configuration

Optional, server-side only (see `.env.example`): `SMITHERY_API_KEY`. Never prefix secrets with `VITE_`.

## Logs

- [`logs.md`](logs.md): change log
- [`build/error.md`](build/error.md): build and error log
