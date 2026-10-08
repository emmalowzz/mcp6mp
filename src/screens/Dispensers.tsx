import { useEffect, useMemo, useState } from 'react';
import { Nfc, RefreshCw, Search, Snowflake, Flame } from 'lucide-react';
import { Button, Card, SectionHeader, Segmented, Sparkline, StatusDot, inputCls, cx } from '../components/ui';
import { useStore } from '../lib/store';
import { mealById, pods, type Pod, type Region } from '../data/catalog';

function useZone(base: number, jitter: number, podId: string) {
  const [hist, setHist] = useState<number[]>(() => Array.from({ length: 30 }, () => base + (Math.random() - 0.5) * jitter));
  useEffect(() => {
    setHist(Array.from({ length: 30 }, () => base + (Math.random() - 0.5) * jitter));
    const t = setInterval(() => {
      setHist((h) => {
        const last = h[h.length - 1];
        const next = last + (base - last) * 0.25 + (Math.random() - 0.5) * jitter;
        return [...h.slice(1), next];
      });
    }, 1500);
    return () => clearInterval(t);
  }, [base, jitter, podId]);
  return hist;
}

function ZoneCard({ kind, podId }: { kind: 'cryo' | 'thermal'; podId: string }) {
  const cryo = kind === 'cryo';
  const target = cryo ? 4 : 65;
  const hist = useZone(target, cryo ? 0.5 : 1.2, podId);
  const now = hist[hist.length - 1];
  const inRange = cryo ? now <= 5 : now >= 60;
  const duty = Math.round(cryo ? 38 + (now - 3.5) * 20 : 44 + (65 - now) * 9);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={cx('grid h-9 w-9 place-items-center rounded-xl text-white', cryo ? 'bg-cryo' : 'bg-thermal')}>
          {cryo ? <Snowflake size={18} /> : <Flame size={18} />}
        </span>
        <div>
          <p className="text-[15px] font-semibold">{cryo ? 'Cryo zone' : 'Thermal zone'}</p>
          <p className="text-[12px] text-muted">Target {target}°C · {cryo ? 'SFA cold-hold ≤5°C' : 'SFA hot-hold ≥60°C'}</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-muted">
          <StatusDot state={inRange ? 'ok' : 'warn'} /> {inRange ? 'In range' : 'Check'}
        </span>
      </div>
      <p className="headline text-[56px] font-bold tabular-nums">
        {now.toFixed(1)}
        <span className="text-[24px] text-muted">°C</span>
      </p>
      <Sparkline values={hist} color={cryo ? '#2f80ed' : '#e8590c'} min={target - (cryo ? 2 : 5)} max={target + (cryo ? 2 : 5)} />
      <dl className="grid grid-cols-3 gap-2 border-t border-hair pt-3 text-[12px]">
        <div>
          <dt className="text-muted">{cryo ? 'Compressor' : 'Heater'}</dt>
          <dd className="text-[15px] font-semibold tabular-nums">{Math.max(5, Math.min(99, duty))}%</dd>
        </div>
        <div>
          <dt className="text-muted">Min / max</dt>
          <dd className="text-[15px] font-semibold tabular-nums">
            {Math.min(...hist).toFixed(1)} / {Math.max(...hist).toFixed(1)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Door</dt>
          <dd className="text-[15px] font-semibold">Latched</dd>
        </div>
      </dl>
    </Card>
  );
}

function McpStatusCard() {
  const { health, healthError, healthLoading, refreshHealth, open } = useStore();
  const up = health?.upstream;
  const state = healthError ? 'down' : !health ? 'idle' : up?.reachable ? 'ok' : 'warn';
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <StatusDot state={state} />
        <p className="text-[15px] font-semibold">Live MCP connection</p>
        <button onClick={refreshHealth} aria-label="Refresh MCP status" className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-black/5">
          <RefreshCw size={15} className={cx(healthLoading && 'animate-spin')} />
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <dt className="text-muted">Smithery gateway</dt>
          <dd className="text-[15px] font-semibold">{healthError ? 'API unreachable' : !up ? 'Checking…' : up.reachable ? 'Reachable' : 'Unreachable'}</dd>
        </div>
        <div>
          <dt className="text-muted">Latency</dt>
          <dd className="text-[15px] font-semibold tabular-nums">{up?.latencyMs != null ? `${up.latencyMs} ms` : '—'}</dd>
        </div>
        <div>
          <dt className="text-muted">HTTP status</dt>
          <dd className="text-[15px] font-semibold tabular-nums">{up?.httpStatus ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted">Proxy tools</dt>
          <dd className="text-[15px] font-semibold tabular-nums">{health?.proxy.tools.length ?? '—'}</dd>
        </div>
      </dl>
      <Button variant="secondary" size="sm" className="mt-auto self-start" onClick={() => open({ type: 'mcp' })}>
        Open inspector
      </Button>
    </Card>
  );
}

function Directory({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const { open } = useStore();
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [status, setStatus] = useState<'all' | Pod['status']>('all');
  const list = useMemo(
    () => pods.filter((p) => (region === 'All' || p.region === region) && (status === 'all' || p.status === status) && `${p.name} ${p.id}`.toLowerCase().includes(q.toLowerCase())),
    [q, region, status],
  );
  const online = pods.filter((p) => p.status === 'online').length;
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="Pod directory" title={`${pods.length} ActiveSG pods island-wide.`} sub={`${online} online now. Tap a pod to view its telemetry, or unlatch a locker.`} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or POD-ID" className={cx(inputCls, 'pl-9')} aria-label="Search pods" />
        </div>
        <select value={region} onChange={(e) => setRegion(e.target.value as Region | 'All')} className={cx(inputCls, 'sm:w-40')} aria-label="Region">
          {['All', 'North', 'North-East', 'East', 'West', 'Central'].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <Segmented
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { id: 'all', label: 'All' },
            { id: 'online', label: 'Online' },
            { id: 'restocking', label: 'Restocking' },
            { id: 'maintenance', label: 'Maintenance' },
          ]}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <div
            key={p.id}
            className={cx('flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition', selected === p.id && 'ring-2 ring-pulse')}
          >
            <button onClick={() => { onSelect(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="min-w-0 flex-1 text-left">
              <p className="text-[12px] text-muted tabular-nums">
                {p.id} · {p.region}
              </p>
              <p className="truncate text-[14px] font-semibold">{p.name}</p>
              <p className="flex items-center gap-1.5 text-[12px] text-muted">
                <StatusDot state={p.status === 'online' ? 'ok' : p.status === 'restocking' ? 'warn' : 'down'} />
                <span className="capitalize">{p.status}</span>
                <span className="tabular-nums">
                  · {p.stock}/{p.capacity}
                </span>
              </p>
            </button>
            <Button size="sm" variant="secondary" disabled={p.status === 'maintenance'} onClick={() => open({ type: 'nfc', podId: p.id })} aria-label={`Unlatch at ${p.name}`}>
              <Nfc size={14} />
            </Button>
          </div>
        ))}
        {!list.length && <p className="text-muted">No pods match those filters.</p>}
      </div>
    </section>
  );
}

export function Dispensers() {
  const { open, reservations } = useStore();
  const [podId, setPodId] = useState('POD-03');
  const pod = pods.find((p) => p.id === podId)!;
  return (
    <>
      <SectionHeader
        eyebrow="Smart Dispensers"
        title="Chilled or hot. Ready when you are."
        sub="Dual-zone IoT lockers keep meals food-safe until you tap your phone or scan the QR on the door."
        right={
          <select value={podId} onChange={(e) => setPodId(e.target.value)} className={cx(inputCls, 'sm:w-72')} aria-label="Select pod">
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.name}
              </option>
            ))}
          </select>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ZoneCard kind="cryo" podId={podId} />
        <ZoneCard kind="thermal" podId={podId} />
        <McpStatusCard />
      </div>

      <Card className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <p className="text-[12px] text-muted">
            {pod.id} · {pod.name} · {pod.stock}/{pod.capacity} lockers stocked
          </p>
          <h3 className="headline mt-1 text-[24px] font-bold">Collect a meal</h3>
          {reservations.length ? (
            <ul className="mt-3 grid gap-2">
              {reservations.map((r) => (
                <li key={r.createdAt} className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas p-3 text-[14px]">
                  <span className="font-semibold">{mealById(r.mealId).name}</span>
                  <span className="text-muted tabular-nums">
                    {r.podId} · passcode {r.passcode}
                  </span>
                  <Button size="sm" className="ml-auto" onClick={() => open({ type: 'nfc', podId: r.podId, passcode: r.passcode })}>
                    Unlatch
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[14px] text-muted">No reservations yet — try the demo unlatch, or reserve a meal first.</p>
          )}
        </div>
        <Button onClick={() => open({ type: 'nfc', podId })} disabled={pod.status === 'maintenance'}>
          <Nfc size={16} /> {pod.status === 'maintenance' ? 'Pod in maintenance' : 'Tap to unlatch'}
        </Button>
      </Card>

      <Directory selected={podId} onSelect={setPodId} />
    </>
  );
}
