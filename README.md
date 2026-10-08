# ActiveNutri

Singapore sports nutrition, recovery and venue-booking ecosystem — Vite + React 19 + TypeScript + Express + Tailwind CSS v4, linked to the Smithery MCP gateway.

Built from [`ACTIVENUTRI_MASTERPROMPT.md`](ACTIVENUTRI_MASTERPROMPT.md) and the team’s Miro Business Model Canvas ([`docs/miro-business-model-canvas.png`](docs/miro-business-model-canvas.png)). The canvas is transcribed in `src/data/bmc.ts` and rendered on the **For Partners** screen, where each block notes the feature it became.

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

The same handlers in `api/` run as Vercel functions and as Express routes (`server.ts`).

```bash
curl -s -X POST localhost:3000/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"calculate_recovery_macros","arguments":{"weight_kg":68,"duration_min":75,"intensity":"high"}}}'
```

## Configuration

Optional, server-side only (see `.env.example`): `SMITHERY_API_KEY`. Never prefix secrets with `VITE_`.

## Logs

- [`logs.md`](logs.md): change log
- [`build/error.md`](build/error.md): build and error log
