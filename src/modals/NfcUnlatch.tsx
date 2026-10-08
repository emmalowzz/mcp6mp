import { useEffect, useState } from 'react';
import { Lock, LockOpen, Nfc, QrCode } from 'lucide-react';
import { Button, Modal, Segmented, cx } from '../components/ui';
import { useStore } from '../lib/store';
import { callTool, type LockerResult } from '../lib/api';
import { pods } from '../data/catalog';

const WINDOW = 15;

export function NfcUnlatch({ podId: initialPod, passcode }: { podId?: string; passcode?: string }) {
  const { close } = useStore();
  const [podId, setPodId] = useState(initialPod ?? 'POD-03');
  const [method, setMethod] = useState<'nfc' | 'qr'>('nfc');
  const [phase, setPhase] = useState<'ready' | 'reading' | 'open' | 'relatched'>('ready');
  const [result, setResult] = useState<LockerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(WINDOW);
  const pod = pods.find((p) => p.id === podId)!;

  useEffect(() => {
    if (phase !== 'open') return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'open' && left === 0) setPhase('relatched');
  }, [phase, left]);

  async function unlatch() {
    setPhase('reading');
    setError(null);
    await new Promise((r) => setTimeout(r, 900));
    try {
      const r = await callTool<LockerResult>('dispenser_claim_locker', { pod_id: podId, passcode, method });
      setResult(r);
      setLeft(WINDOW);
      setPhase('open');
    } catch (e) {
      setError((e as Error).message);
      setPhase('ready');
    }
  }

  const pct = (left / WINDOW) * 100;

  return (
    <Modal title="NFC Locker Unlatch" onClose={close}>
      <div className="grid gap-4">
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <label className="grid gap-1.5">
            <span className="text-[13px] font-medium text-muted">Pod</span>
            <select
              value={podId}
              disabled={phase === 'reading' || phase === 'open'}
              onChange={(e) => { setPodId(e.target.value); setPhase('ready'); setResult(null); }}
              className="h-11 rounded-xl border border-hair bg-white px-3 text-[15px]"
            >
              {pods.filter((p) => p.status !== 'maintenance').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.name}
                </option>
              ))}
            </select>
          </label>
          <Segmented label="Unlatch method" value={method} onChange={setMethod} options={[{ id: 'nfc', label: 'NFC' }, { id: 'qr', label: 'QR' }]} />
        </div>
        {passcode && <p className="text-[13px] text-muted">Pickup passcode <span className="font-semibold text-ink tabular-nums">{passcode}</span> attached.</p>}

        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl bg-ink text-white">
          {phase === 'open' && (
            <svg viewBox="0 0 100 100" className="absolute h-48 w-48 -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="5" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 283} 283`} style={{ transition: 'stroke-dasharray 1s linear' }} />
            </svg>
          )}
          <div className="relative text-center">
            {phase === 'ready' && (
              <>
                {method === 'nfc' ? <Nfc size={56} className="mx-auto" /> : <QrCode size={56} className="mx-auto" />}
                <p className="mt-3 text-[15px] font-semibold">{method === 'nfc' ? 'Hold your phone near the pod reader' : 'Scan the QR code on the pod door'}</p>
                <p className="text-[12px] text-white/60">{pod.name}</p>
              </>
            )}
            {phase === 'reading' && (
              <>
                <span className="relative mx-auto block h-14 w-14">
                  <span className="anim-ping absolute inset-0 rounded-full bg-emerald-400" />
                  <Nfc size={56} className="relative" />
                </span>
                <p className="mt-3 text-[15px] font-semibold">Authenticating with {podId}…</p>
              </>
            )}
            {phase === 'open' && result && (
              <>
                <LockOpen size={36} className="mx-auto text-emerald-400" />
                <p className="mt-2 text-[44px] font-bold tabular-nums">{left}s</p>
                <p className="text-[14px] font-semibold">
                  Locker {result.locker} open · {result.zone}
                </p>
                <p className="text-[12px] text-white/60">Take your meal and close the door</p>
              </>
            )}
            {phase === 'relatched' && (
              <>
                <Lock size={40} className="mx-auto" />
                <p className="mt-3 text-[15px] font-semibold">Locker {result?.locker} re-latched for safety</p>
                <p className="text-[12px] text-white/60">Window closed after {WINDOW} seconds</p>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-[13px] text-alert">{error}</p>}

        {phase === 'open' ? (
          <Button variant="secondary" onClick={() => setPhase('relatched')}>
            I’ve collected it — latch now
          </Button>
        ) : (
          <Button onClick={unlatch} disabled={phase === 'reading'} className={cx(phase === 'relatched' && 'bg-pulse')}>
            {phase === 'relatched' ? 'Unlatch again' : phase === 'reading' ? 'Reading…' : method === 'nfc' ? 'Simulate NFC tap' : 'Simulate QR scan'}
          </Button>
        )}
        <p className="text-[11px] text-muted">Demo unlatch. For food safety, doors auto-latch after {WINDOW} s.</p>
      </div>
    </Modal>
  );
}
