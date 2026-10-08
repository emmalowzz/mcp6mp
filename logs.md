# Change Log

Synchronised with `/build/error.md` on every push.

## 2026-10-08 — v1.3.0 Simpler For Partners page

- **For Partners is now just the partner inquiry form:** the circular revenue model, stakeholder cards, unit-economics calculator and on-page Business Model Canvas are gone. The form keeps its three steps and has a short intro.
- **Removed `src/data/bmc.ts`:** only the canvas section used it. The Miro board image stays in `docs/` as the design artefact.
- **Footer:** the Strategyzer template credit has moved to the README, since the canvas is no longer shown on the site.

## 2026-10-08 — v1.2.0 MCP check moved to the back end only

- **Removed from the website:** the header MCP status button, the MCP Status Inspector pop-up, the "Live MCP connection" card, the footer "Check MCP status" link and Smithery mention, and on-screen mentions of MCP tools or `/api/mcp`.
- **No browser health checks:** the website no longer polls `/api/health`. The Smart Dispensers card slot now shows pod status (stock, restock times, region).
- **New `/api/tools` route:** the web app now calls `/api/tools` (`api/tools.js` plus an Express route), which uses the same handler as `/api/mcp`. `/api/mcp` and `/api/health` are unchanged for back-end use.
- **New back-end check:** `npm run check:mcp` (`scripts/check-mcp.js`) checks the gateway directly or through a deployment's `/api/health`, and exits 0 or 1.
- **Renamed:** `src/lib/mcp.ts` is now `src/lib/api.ts`.

## 2026-10-08 — v1.1.0 More appealing meals and clearer ordering

- **Meal illustrations:** each of the four meals now has a detailed top-down illustration (`src/components/MealArt.tsx`). An optional `photo` field swaps in a real photo (see README).
- **Meal content:** each meal now has a tagline, ingredients, allergens, a "good for" line and a nutritionist's note.
- **New meal detail pop-up:** shows the meal next to two prices: order once, or S$4.45 a meal on the Athlete plan.
- **Overview:**
  - The hero now leads with the food ("Order a meal", "See plans from S$4.45/meal") and adds trust points.
  - New "On the menu today" strip and "How it works" steps.
  - The Athlete tier shows its per-meal price, the saving, and meal thumbnails.
  - "Cancel anytime" and "No card needed" notes added.
- **Nutrition & Meals:**
  - Chef's-pick banner, image-led menu cards, and an Athlete-plan upsell.
  - The Snap & Calculate frame now matches the table colour.
- **Ordering:** the order pop-up shows the meal image, confirms with the meal, and suggests the plan. Images also appear in the venue stock lists and in My orders.
- **Header:** new "My orders" shortcut once a meal is ordered.
- **Phone:** bottom tabs relabelled Overview, Meals, Venues, Pods, Partners.

## 2026-10-08 — Add prompt.md

- Added `prompt.md` with every prompt given to Claude Code for this project, in order.

## 2026-10-08 — v1.0.0 Initial build

**Source inputs:** `ACTIVENUTRI_MASTERPROMPT.md` and the team’s Miro Business Model Canvas (`docs/miro-business-model-canvas.png`).

### Server
- `api/health.js`: GET/POST probe of `https://mcp.smithery.ai/emmalowzz` (MCP `initialize`, then `tools/list` if authorised). Reports reachability, latency, HTTP status and remote tools. Uses `AbortController` with a 4000 ms timeout and treats 200–499 as reachable. Reads the optional `SMITHERY_API_KEY` server-side only and never returns it.
- `api/mcp.js`: stateless JSON-RPC 2.0 MCP proxy (`initialize`, `ping`, `tools/list`, `tools/call`, batches). Tools: `activesg_book_court`, `calculate_recovery_macros`, `dispenser_claim_locker`. Bookings and locker unlatching are simulated; nothing is charged or persisted.
- `server.ts`: Express mounts both handlers at `/api/health(.js)` and `/api/mcp(.js)`, hosts Vite middleware in development, and serves `dist` with immutable asset caching in production. Sets security headers.

### Screens
- **Overview:** live biometric telemetry (training/recovery), 4-pillar bento, recovery calculator (MCP) with map preview, 48-pod locator with geolocation, and the Community S$0 / Athlete S$89 / Academy S$1,000 tiers.
- **Nutrition & Meals:** Sous-vide Salmon, Citrus Herb Chicken, Tempeh Quinoa Bowl and Warm Bone Broth Congee, with dietary filters, macro donuts, the `PULSE-FIRST-SG` voucher (first reservation only), and Snap & Calculate (camera or sample plates, live bounding boxes).
- **Sports Venues:** OneMap-style map with Clementi, Bishan, Jurong East and Kallang. Court-availability drawer (MCP booking), dispenser stock counters, booking-bot console, community sparring and AHPC physio.
- **Smart Dispensers:** Cryo 4°C / Thermal 65°C telemetry, live MCP status, NFC/QR unlatch with a 15 s safety timer, and a 48-pod directory.
- **For Partners:** four-pillar circular revenue model, stakeholder bento, unit-economics calculator (Miro cost structure), the full Miro Business Model Canvas with a feature trace, and a 3-step partner inquiry.
- **Modals:** MCP Status Inspector, NFC Locker Unlatch, Meal Reservation with pickup passcode, and Singpass/MyActiveSG Get Started.
- **Footer:** HPB, SFA, ActiveSG and PDPA compliance notes.
