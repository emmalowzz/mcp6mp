# Change Log

Synchronised with `/build/error.md` on every push.

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
