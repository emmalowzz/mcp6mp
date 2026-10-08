# Build & Error Log

Synchronised with every push. Newest first.

## 2026-10-08 — v1.1.0 Meal imagery and conversion UX

| # | Area | Error / symptom | Root cause | Fix | Status |
|---|------|-----------------|------------|-----|--------|
| 4 | Assets | Stock food photos could not be downloaded | Build environment network policy blocks images.unsplash.com, images.pexels.com and upload.wikimedia.org | Drew meal illustrations in SVG; added an optional `photo` field for real photos | Worked around |
| 3 | UI · Snap & Calculate | Black bars beside the sample plate | Square SVG drawn inside a 4:3 frame | The frame background now matches the table colour | Fixed |

### Verification
- `npm run typecheck` and `npm run build`: clean
- Headless Chromium end-to-end, including the new meal detail → Order once → confirm → My orders → Unlatch flow: no page errors
- No horizontal overflow at 390 px and 1280 px

## 2026-10-08 — Add prompt.md

Documentation only; no build or runtime errors.

## 2026-10-08 — Initial ActiveNutri build

| # | Area | Error / symptom | Root cause | Fix | Status |
|---|------|-----------------|------------|-----|--------|
| 2 | UI · Overview tiers | “Athlete” membership card invisible, Playwright reported it “not stable” | Custom keyframe class `.ring-pulse` collided with the Tailwind v4 utility `ring-pulse` (ring colour = `--color-pulse`), so the featured card inherited an infinite scale/fade animation | Renamed the animation class to `.anim-ping` | Fixed |
| 1 | UI · Pod locator | Map overflowed its grid column and covered the membership section on desktop | `h-full` + `aspect-ratio` let the map size from row height; `fr` tracks have an implicit `min-width: auto` | Removed `h-full`; all custom grid tracks now use `minmax(0, …fr)` | Fixed |

### Verification
- `npm run typecheck` — clean
- `npm run build` — clean (≈353 kB JS / 108 kB gzip)
- Express routes `/api/health`, `/api/health.js`, `/api/mcp`, `/api/mcp.js` — all respond
- Headless Chromium end-to-end: calculator → reserve → NFC unlatch, voucher, Snap & Calculate, court booking drawer, booking bot, MCP inspector, partner inquiry, Singpass onboarding — no page errors
- No horizontal overflow at 390 px and 1280 px

### Known conditions (not errors)
- The Smithery gateway answers `403` without a server-side `SMITHERY_API_KEY`. Per spec, any 200–499 counts as reachable, so status shows **online / not authenticated**.
