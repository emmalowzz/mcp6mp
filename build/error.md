# Build & Error Log

Synchronised with every push. Newest first.

## 2026-10-08 — v1.4.1 Rebuilt from commit b9c1e8a

No errors. App code matches `b9c1e8a`. Verified with `git diff b9c1e8a -- . ':!logs.md' ':!build/error.md' ':!prompt.md'` (empty), plus `npm run typecheck`, `npm run build` and the end-to-end browser tests.

## 2026-10-08 — v1.4.0 My Daily Needs tab (NutriBalance)

| # | Area | Error / symptom | Root cause | Fix | Status |
|---|------|-----------------|------------|-----|--------|
| 7 | Diagnosis | Earlier logs said Smithery answered `403` because no key was set | The 403 actually came from the build sandbox's egress proxy (`connect_rejected` for `*.smithery.ai`); Smithery was never reached | Corrected the v1.0.0 note. `check:mcp` now prints a warning on any 401/403 | Fixed |
| 6 | Integration | Could not read NutriBalance's tool list during the build | Sandbox blocks `server.smithery.ai`, `smithery.ai`, `mcp.so` and `nutribalance-mcp.vercel.app`; npm has no `nutribalance-mcp` package | Tools are found and mapped at runtime from the server's own `tools/list` and `inputSchema`. Tested against a local mock MCP server; falls back to built-in formulas | Worked around; needs a live check after deploy |
| 5 | UI · header | Desktop nav labels wrapped onto two lines at 768–1023 px once a sixth tab was added | Not enough room for six labels | Desktop nav now starts at 1024 px with the bottom tab bar below that; labels and buttons set to `nowrap` | Fixed |
| 4b | UI · My Daily Needs | Food-name input collapsed while the grams input stretched | Conflicting `w-full` and `w-24` utilities | Each input sits in its own sized wrapper | Fixed |

### Verification
- `npm run typecheck` and `npm run build`: clean
- `/api/nutrition` against a mock NutriBalance MCP server (session ids, SSE replies, schema names unlike ours): all four actions used NutriBalance tools with correctly mapped arguments (`activity_level: moderately_active`, `goal: lose_weight`, `calorie_goal: 1744`, `foods: [...]`)
- Same flow against the real URL (blocked here): every action fell back to built-in formulas and was labelled *ActiveNutri estimate*
- Headless Chromium, desktop and 390 px: calculate → add food → quick add → score → plan → reload (data kept). No page errors; browser called only `/api/nutrition`. Full regression of all other flows passed.

## 2026-10-08 — v1.3.0 Simpler For Partners page

No build or runtime errors.

### Verification
- `npm run typecheck` and `npm run build`: clean
- Headless Chromium end-to-end, including all three partner inquiry steps and submit: no page errors
- No horizontal overflow at 390 px and 1280 px

## 2026-10-08 — v1.2.0 MCP check moved to the back end only

No build or runtime errors.

### Verification
- `npm run typecheck` and `npm run build`: clean
- Built front-end bundle (`dist/`): 0 occurrences of "mcp" or "smithery"
- Headless Chromium end-to-end, all flows: no page errors. The only API route the browser called was `/api/tools`, and no page text mentions MCP.
- `npm run check:mcp` → `OK https://mcp.smithery.ai/emmalowzz · HTTP 403 · authenticated: no` (exit 0)

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
- ~~The Smithery gateway answers `403` without a server-side `SMITHERY_API_KEY`.~~ **Corrected in v1.4.0:** that 403 came from the build sandbox's egress proxy, not from Smithery. The real gateway response is unverified until the check runs from a deployment.
