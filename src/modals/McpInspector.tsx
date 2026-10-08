import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, Modal, StatusDot, cx } from '../components/ui';
import { useStore } from '../lib/store';
import { listTools, type ToolInfo } from '../lib/mcp';

export function McpInspector() {
  const { close, health, healthError, healthLoading, refreshHealth } = useStore();
  const [tools, setTools] = useState<ToolInfo[] | null>(null);
  const [toolErr, setToolErr] = useState<string | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const up = health?.upstream;

  async function loadTools() {
    setLoadingTools(true);
    setToolErr(null);
    try {
      setTools(await listTools());
    } catch (e) {
      setToolErr((e as Error).message);
    } finally {
      setLoadingTools(false);
    }
  }

  const rows: [string, string][] = [
    ['Endpoint', up?.endpoint ?? 'https://mcp.smithery.ai/emmalowzz'],
    ['Reachable', healthError ? 'Health API unreachable' : up ? (up.reachable ? 'Yes' : 'No') : 'Checking…'],
    ['HTTP status', up?.httpStatus != null ? String(up.httpStatus) : '—'],
    ['Latency', up?.latencyMs != null ? `${up.latencyMs} ms` : '—'],
    ['Authenticated session', up ? (up.authenticated ? 'Yes' : 'No — gateway requires a server-side key') : '—'],
    ['Server', up?.serverInfo?.name ? `${up.serverInfo.name} ${up.serverInfo.version ?? ''}` : '—'],
    ['Remote tools', up?.remoteTools.length ? up.remoteTools.join(', ') : '—'],
    ['Server-side key configured', health ? (health.credentialConfigured ? 'Yes (never sent to browser)' : 'No') : '—'],
    ['Last checked', health ? new Date(health.checkedAt).toLocaleTimeString('en-SG') : '—'],
  ];

  return (
    <Modal title="Smithery MCP Status Inspector" onClose={close} wide>
      <div className="mb-4 flex items-center gap-2 text-[14px]">
        <StatusDot state={healthError ? 'down' : !up ? 'idle' : up.reachable ? 'ok' : 'warn'} />
        <span className="font-semibold">{healthError ? 'Offline' : !up ? 'Checking' : up.reachable ? 'Gateway reachable' : 'Gateway unreachable'}</span>
        <Button size="sm" variant="secondary" className="ml-auto" onClick={refreshHealth} disabled={healthLoading}>
          <RefreshCw size={14} className={cx(healthLoading && 'animate-spin')} /> Re-check
        </Button>
      </div>
      {up?.error && <p className="mb-3 text-[13px] text-alert">{up.error}</p>}
      {healthError && <p className="mb-3 text-[13px] text-alert">{healthError}</p>}
      <dl className="divide-y divide-hair rounded-2xl bg-canvas px-4 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 py-2.5">
            <dt className="w-44 shrink-0 text-muted">{k}</dt>
            <dd className="min-w-0 break-words font-medium tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12px] text-muted">Any HTTP 200–499 response counts as reachable. Requests time out after 4,000 ms and run server-side via /api/health.</p>

      <div className="mt-6 flex items-center justify-between">
        <h4 className="text-[15px] font-semibold">Local proxy tools · /api/mcp</h4>
        <Button size="sm" onClick={loadTools} disabled={loadingTools}>
          {loadingTools ? 'Listing…' : tools ? 'Refresh' : 'Run tools/list'}
        </Button>
      </div>
      {toolErr && <p className="mt-2 text-[13px] text-alert">{toolErr}</p>}
      <ul className="mt-3 grid gap-2">
        {(tools ?? health?.proxy.tools.map((name) => ({ name, description: '', inputSchema: null })) ?? []).map((t) => (
          <li key={t.name} className="rounded-2xl border border-hair p-3">
            <p className="font-mono text-[13px] font-semibold">{t.name}</p>
            {t.description && <p className="mt-0.5 text-[12px] text-muted">{t.description}</p>}
            {t.inputSchema != null && (
              <p className="mt-1 font-mono text-[11px] text-muted">
                args: {Object.keys((t.inputSchema as { properties: object }).properties).join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
