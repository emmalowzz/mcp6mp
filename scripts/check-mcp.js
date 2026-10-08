// Back-end MCP check: probes the Smithery gateway from the server and prints the result.
// Usage: npm run check:mcp            (direct probe, no server needed)
//        npm run check:mcp -- <url>   (call a running deployment's /api/health instead)
import { probeSmithery } from '../api/health.js';

const target = process.argv[2];
let report;
if (target) {
  const res = await fetch(new URL('/api/health', target), { method: 'GET' });
  report = (await res.json()).upstream;
} else {
  report = await probeSmithery();
}

const ok = report.reachable;
console.log(`${ok ? 'OK  ' : 'FAIL'}  ${report.endpoint}`);
console.log(`      HTTP ${report.httpStatus ?? '—'} · ${report.latencyMs ?? '—'} ms · authenticated: ${report.authenticated ? 'yes' : 'no'}`);
if (report.remoteTools?.length) console.log(`      tools: ${report.remoteTools.join(', ')}`);
if (report.error) console.log(`      error: ${report.error}`);
process.exit(ok ? 0 : 1);
