// GET/POST /api/health
// Reports reachability, latency, HTTP status and tool capabilities of the
// external Smithery MCP gateway and the NutriBalance MCP server. Runs as a Vercel function and as an Express
// route (see server.ts). Credentials are read server-side only and never echoed.

import { probeNutriBalance } from './nutrition.js';

const SMITHERY_URL = 'https://mcp.smithery.ai/emmalowzz';
const TIMEOUT_MS = 4000;

const LOCAL_TOOLS = ['activesg_book_court', 'calculate_recovery_macros', 'dispenser_claim_locker'];
const NUTRITION_ACTIONS = ['targets', 'food', 'score', 'plan'];

function setHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function postJsonRpc(body, signal) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  const key = process.env.SMITHERY_API_KEY;
  if (key) headers.Authorization = `Bearer ${key}`;
  return fetch(SMITHERY_URL, { method: 'POST', headers, body: JSON.stringify(body), signal });
}

// Streamable HTTP servers may answer with SSE; pull the first JSON-RPC payload out.
async function readRpc(response) {
  const text = await response.text();
  const type = response.headers.get('content-type') || '';
  try {
    if (type.includes('text/event-stream')) {
      const line = text.split('\n').find((l) => l.startsWith('data:'));
      return line ? JSON.parse(line.slice(5).trim()) : null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function probeSmithery() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  const result = {
    endpoint: SMITHERY_URL,
    reachable: false,
    httpStatus: null,
    latencyMs: null,
    authenticated: false,
    serverInfo: null,
    remoteTools: [],
    error: null,
  };

  try {
    const init = await postJsonRpc(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'activenutri-health', version: '1.0.0' },
        },
      },
      controller.signal,
    );
    result.latencyMs = Date.now() - started;
    result.httpStatus = init.status;
    // Any 2xx-4xx response proves the host is up, even if it wants auth.
    result.reachable = init.status >= 200 && init.status <= 499;
    result.authenticated = init.ok;

    if (init.ok) {
      const payload = await readRpc(init);
      result.serverInfo = payload?.result?.serverInfo ?? null;
      const sessionId = init.headers.get('mcp-session-id');
      const list = await fetch(SMITHERY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
          ...(process.env.SMITHERY_API_KEY ? { Authorization: `Bearer ${process.env.SMITHERY_API_KEY}` } : {}),
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
        signal: controller.signal,
      });
      const tools = await readRpc(list);
      result.remoteTools = (tools?.result?.tools ?? []).map((t) => t.name).slice(0, 50);
    } else {
      await init.body?.cancel?.();
    }
  } catch (err) {
    result.latencyMs = Date.now() - started;
    result.error = err?.name === 'AbortError' ? `Timed out after ${TIMEOUT_MS} ms` : 'Network error reaching gateway';
  } finally {
    clearTimeout(timer);
  }
  return result;
}

export default async function healthHandler(req, res) {
  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [upstream, nutribalance] = await Promise.all([probeSmithery(), probeNutriBalance()]);
  return res.status(200).json({
    service: 'activenutri',
    status: upstream.reachable && nutribalance.reachable ? 'online' : 'degraded',
    checkedAt: new Date().toISOString(),
    upstream,
    nutribalance,
    proxy: { endpoint: '/api/mcp', tools: LOCAL_TOOLS },
    nutrition: { endpoint: '/api/nutrition', actions: NUTRITION_ACTIONS, fallback: 'built-in estimate when NutriBalance is unreachable' },
    credentialConfigured: Boolean(process.env.SMITHERY_API_KEY),
  });
}
