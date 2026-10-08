// Back-end MCP check: probes the Smithery gateway and NutriBalance from the server and prints the result.
// Usage: npm run check:mcp            (direct probe, no server needed)
//        npm run check:mcp -- <url>   (call a running deployment's /api/health instead)
import { probeSmithery } from '../api/health.js';
import { probeNutriBalance } from '../api/nutrition.js';

const target = process.argv[2];
let reports;
if (target) {
  const res = await fetch(new URL('/api/health', target), { method: 'GET' });
  const body = await res.json();
  reports = [['Smithery gateway', body.upstream], ['NutriBalance', body.nutribalance]];
} else {
  reports = [['Smithery gateway', await probeSmithery()], ['NutriBalance', await probeNutriBalance()]];
}

let allOk = true;
for (const [label, r] of reports) {
  if (!r) continue;
  const ok = r.reachable;
  allOk &&= ok;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label} · ${r.endpoint}`);
  console.log(`      HTTP ${r.httpStatus ?? '—'} · ${r.latencyMs ?? '—'} ms${'authenticated' in r ? ` · authenticated: ${r.authenticated ? 'yes' : 'no'}` : ''}`);
  const tools = r.remoteTools || r.tools;
  if (tools?.length) console.log(`      tools: ${tools.join(', ')}`);
  if (r.error) console.log(`      error: ${r.error}`);
  if (r.httpStatus === 401 || r.httpStatus === 403)
    console.log('      note: host answered but refused access. Set SMITHERY_API_KEY, or check that no firewall/proxy is blocking this host.');
}
process.exit(allOk ? 0 : 1);
