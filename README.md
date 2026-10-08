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
| `GET /api/mcp` | MCP status: `"ok"` or `"not ok"` (HTTP 200 / 503) per server and overall, plus the tool manifest. Add `?format=text` for plain text |
| `POST /api/mcp` | MCP JSON-RPC 2.0: `initialize`, `tools/list`, `tools/call` |
| `POST /api/nutrition` | My Daily Needs: `targets`, `food`, `score`, `plan`. Calls NutriBalance over MCP; falls back to built-in formulas |
| `POST /api/tools` | Same handler as `/api/mcp`. This is the route the web app calls, so the front end never references MCP. |

The same handlers in `api/` run as Vercel functions and as Express routes (`server.ts`).

## My Daily Needs and NutriBalance

The **My Daily Needs** tab takes a person's stats (age, sex, height, weight, activity, training today, goal, diet) and returns:
- daily calories (BMR, TDEE, target), macros, water, fibre and key micronutrients
- a food log with progress bars against those targets
- a 0–100 daily score with priorities
- a suggested day of meals, plus ActiveNutri meals that fit the calories left

The form, today's log and weight history are saved in the browser's localStorage only.

`api/nutrition.js` is an MCP client for NutriBalance (`NUTRIBALANCE_MCP_URL`, default `https://server.smithery.ai/NutriBalance/nutribalance-mcp`):
1. It opens a Streamable HTTP session and runs `tools/list` (cached for 5 minutes).
2. It picks the right tool for each job by name and description (TDEE/macros, food lookup, daily score, meal plan).
3. It fills that tool's arguments from its own `inputSchema`. For example, `moderate` is matched to an `activity_level` option such as `moderately_active`, and the calorie target goes to a field such as `calorie_goal`.
4. It normalises the reply and rejects implausible numbers.

If NutriBalance is unreachable, needs a key, or a call fails, the route answers from built-in formulas (Mifflin-St Jeor plus standard RDAs and a local food table). The page labels each result *Calculated by NutriBalance* or *ActiveNutri estimate*.

## Back-end MCP check

### `GET /api/mcp` status

```bash
curl -s https://your-app.vercel.app/api/mcp?format=text
not ok
ok     ActiveNutri tool proxy · 3 tools
not ok Smithery gateway (HTTP 403: no values returned)
ok     NutriBalance · 5 tools
```

A server is **ok** only when it returns values: a successful (2xx) reply with at least one tool from `tools/list`. Anything else is **not ok**, with a reason: a timeout, a network error, a refusal such as 401/403, or a connection that returns no tools. The overall status is `ok` only when every check is ok, and the HTTP code is 200 for ok and 503 for not ok, so uptime monitors can watch it directly. This is stricter than `/api/health`, which follows the master prompt's rule that any 200–499 response proves the host is reachable.

### `npm run check:mcp`


The MCP gateway check is back-end only; the website never calls it or mentions it.

```bash
npm run check:mcp                                   # probe the Smithery gateway directly from this machine
npm run check:mcp -- https://your-app.vercel.app    # ask a deployed server's /api/health
curl -s https://your-app.vercel.app/api/health      # raw JSON report
```

`check:mcp` probes both the Smithery gateway and NutriBalance. It exits with 0 when both are reachable (any HTTP 200–499 response) and 1 otherwise, so it can run in CI or a cron job.

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
