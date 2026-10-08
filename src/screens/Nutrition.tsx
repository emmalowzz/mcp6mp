import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff, Check, ScanLine, Ticket } from 'lucide-react';
import { Button, Card, Donut, MacroLegend, SectionHeader, Segmented, inputCls, cx } from '../components/ui';
import { categories, meals, type Category } from '../data/catalog';
import { sgd, useStore, VOUCHER_CODE, VOUCHER_DISCOUNT } from '../lib/store';

function MealBento() {
  const { open, voucher } = useStore();
  const [cat, setCat] = useState<Category>('all');
  const list = meals.filter((m) => cat === 'all' || m.tags.includes(cat));
  return (
    <section>
      <SectionHeader
        eyebrow="SFA Grade-A recovery meals"
        title="Cooked in licensed kitchens. Collected warm or chilled."
        sub="Each recipe is vetted by a board-certified nutritionist and portioned for the first hour after training."
      />
      <div className="mb-5">
        <Segmented label="Dietary category" value={cat} onChange={setCat} options={categories} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((m, i) => {
          const price = voucher ? m.priceSgd * (1 - VOUCHER_DISCOUNT) : m.priceSgd;
          return (
            <Card key={m.id} className={cx('flex flex-col gap-5', i === 0 && list.length > 2 && 'md:row-span-1')}>
              <div className="flex items-start gap-5">
                <Donut
                  protein={m.protein}
                  carbs={m.carbs}
                  fat={m.fat}
                  size={104}
                  center={
                    <div>
                      <div className="text-[18px] font-bold tabular-nums">{m.kcal}</div>
                      <div className="text-[10px] text-muted">kcal</div>
                    </div>
                  }
                />
                <div className="min-w-0 flex-1">
                  <h3 className="headline text-[22px] font-bold">{m.name}</h3>
                  <p className="mt-1 text-[14px] text-muted">{m.blurb}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <MacroLegend protein={m.protein} carbs={m.carbs} fat={m.fat} />
                  <p className="mt-3 text-[12px] text-muted">
                    Nutri-Grade A · SFA Grade-A hygiene · {m.kitchen} · held in {m.zone} zone
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <p className="text-right tabular-nums">
                    {voucher && <span className="mr-1.5 text-[13px] text-muted line-through">{sgd(m.priceSgd)}</span>}
                    <span className="text-[20px] font-bold">{sgd(Math.round(price * 100) / 100)}</span>
                  </p>
                  <Button size="sm" onClick={() => open({ type: 'reserve', mealId: m.id })}>
                    Reserve
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {!list.length && <p className="text-muted">No meals in this category yet.</p>}
      </div>
    </section>
  );
}

type Item = { label: string; x: number; y: number; w: number; h: number; kcal: number; protein: number; carbs: number; fat: number; color: string };
type Plate = { id: string; name: string; note: string; items: Item[] };

const plates: Plate[] = [
  {
    id: 'chicken-rice',
    name: 'Hawker chicken rice',
    note: 'Typical hawker plate',
    items: [
      { label: 'Oily rice', x: 18, y: 28, w: 36, h: 40, kcal: 380, protein: 6, carbs: 62, fat: 12, color: '#f5b83d' },
      { label: 'Roast chicken', x: 52, y: 22, w: 30, h: 34, kcal: 260, protein: 24, carbs: 2, fat: 17, color: '#f97362' },
      { label: 'Cucumber', x: 54, y: 58, w: 24, h: 18, kcal: 8, protein: 0, carbs: 2, fat: 0, color: '#5bbf7a' },
      { label: 'Chilli sauce', x: 30, y: 70, w: 16, h: 14, kcal: 45, protein: 0, carbs: 6, fat: 2, color: '#e11d48' },
    ],
  },
  {
    id: 'nasi-lemak',
    name: 'Nasi lemak',
    note: 'Coconut rice set',
    items: [
      { label: 'Coconut rice', x: 20, y: 25, w: 34, h: 40, kcal: 420, protein: 6, carbs: 58, fat: 18, color: '#f5b83d' },
      { label: 'Fried chicken wing', x: 54, y: 20, w: 28, h: 26, kcal: 290, protein: 18, carbs: 10, fat: 20, color: '#f97362' },
      { label: 'Fried egg', x: 56, y: 50, w: 24, h: 22, kcal: 90, protein: 6, carbs: 0, fat: 7, color: '#facc15' },
      { label: 'Ikan bilis & peanuts', x: 28, y: 66, w: 26, h: 16, kcal: 160, protein: 8, carbs: 4, fat: 12, color: '#a16207' },
    ],
  },
  {
    id: 'tempeh-bowl',
    name: 'ActiveNutri Tempeh Bowl',
    note: 'Recovery meal from your pod',
    items: [
      { label: 'Quinoa', x: 18, y: 26, w: 34, h: 36, kcal: 220, protein: 8, carbs: 39, fat: 4, color: '#f5b83d' },
      { label: 'Kecap tempeh', x: 52, y: 22, w: 30, h: 28, kcal: 210, protein: 19, carbs: 10, fat: 11, color: '#a16207' },
      { label: 'Kale & carrot', x: 48, y: 54, w: 32, h: 24, kcal: 60, protein: 3, carbs: 10, fat: 1, color: '#5bbf7a' },
      { label: 'Peanut-lime dressing', x: 24, y: 66, w: 20, h: 14, kcal: 50, protein: 1, carbs: 5, fat: 1, color: '#e8590c' },
    ],
  },
];

function PlateArt({ plate }: { plate: Plate }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="100" height="100" fill="#3b2f2a" />
      <circle cx="50" cy="52" r="44" fill="#f4f4f5" />
      <circle cx="50" cy="52" r="36" fill="#fafafa" />
      {plate.items.map((it) => (
        <ellipse key={it.label} cx={it.x + it.w / 2} cy={it.y + it.h / 2} rx={it.w / 2.3} ry={it.h / 2.3} fill={it.color} opacity=".85" />
      ))}
    </svg>
  );
}

function SnapAndCalculate() {
  const [plateId, setPlateId] = useState(plates[0].id);
  const [camera, setCamera] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [tick, setTick] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const plate = plates.find((p) => p.id === plateId)!;

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => setTick((n) => n + 1), 350);
    return () => clearInterval(t);
  }, [scanning]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  async function toggleCamera() {
    if (camera) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamera(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCamera(true);
      setCamError(null);
      setScanning(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCamError('Camera unavailable or permission denied — using the sample plate.');
    }
  }

  // Deterministic jitter so boxes "track" while live.
  const boxes = plate.items.map((it, i) => {
    const j = scanning ? Math.sin(tick * 0.9 + i * 1.7) * 1.2 : 0;
    const conf = scanning ? 0.86 + ((Math.sin(tick * 0.6 + i) + 1) / 2) * 0.12 : 0.97 - i * 0.01;
    return { ...it, x: it.x + j, y: it.y - j * 0.6, conf };
  });
  const totals = useMemo(
    () => plate.items.reduce((a, b) => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
    [plate],
  );
  const verdict = totals.protein >= 25 && totals.fat <= 20 ? 'Good recovery balance' : totals.fat > 30 ? 'High in fat for a recovery meal' : 'Low in protein for recovery';

  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="Snap & Calculate"
        title="Point. Snap. Know your macros."
        sub="Photograph any plate — hawker or home-cooked — and see how it stacks up against your recovery target."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-black">
          {camera ? <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" /> : <PlateArt plate={plate} />}
          {scanning && <div className="scanline absolute inset-x-0 h-0.5 bg-emerald-400/80 shadow-[0_0_16px_#34d399]" />}
          {boxes.map((b) => (
            <div
              key={b.label}
              className="absolute rounded-md border-2 transition-all duration-300"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, borderColor: b.color }}
            >
              <span className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 text-[10px] font-semibold text-white tabular-nums" style={{ background: b.color }}>
                {b.label} {(b.conf * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
            <span className="text-[11px] text-white/80">{scanning ? 'Detecting…' : 'Captured'} · on-device demo model</span>
            <div className="flex gap-2">
              <button onClick={toggleCamera} className="flex h-8 items-center gap-1 rounded-full bg-white/20 px-3 text-[12px] font-semibold backdrop-blur hover:bg-white/30">
                {camera ? <CameraOff size={14} /> : <Camera size={14} />} {camera ? 'Stop camera' : 'Use camera'}
              </button>
              <button
                onClick={() => setScanning((s) => !s)}
                className="flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-ink hover:bg-white/90"
              >
                <ScanLine size={14} /> {scanning ? 'Snap' : 'Rescan'}
              </button>
            </div>
          </div>
        </div>

        <Card className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <span className="text-[13px] font-medium text-muted">{camera ? 'Detection preset for the live feed' : 'Sample plate'}</span>
            <Segmented label="Sample plate" value={plateId} onChange={(id) => { setPlateId(id); setScanning(true); }} options={plates.map((p) => ({ id: p.id, label: p.name }))} />
          </div>
          {camError && <p className="text-[12px] text-alert">{camError}</p>}
          {scanning ? (
            <p className="py-6 text-center text-[15px] text-muted">Hold steady, then tap Snap to calculate.</p>
          ) : (
            <>
              <div className="flex items-center gap-5">
                <Donut
                  protein={totals.protein}
                  carbs={totals.carbs}
                  fat={totals.fat}
                  size={112}
                  center={
                    <div>
                      <div className="text-[20px] font-bold tabular-nums">{totals.kcal}</div>
                      <div className="text-[10px] text-muted">kcal</div>
                    </div>
                  }
                />
                <div className="flex-1">
                  <MacroLegend protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
                </div>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="pb-1 font-medium">Item</th>
                    <th className="pb-1 text-right font-medium">kcal</th>
                    <th className="pb-1 text-right font-medium">P / C / F g</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {plate.items.map((it) => (
                    <tr key={it.label} className="border-t border-hair">
                      <td className="py-1.5">{it.label}</td>
                      <td className="py-1.5 text-right">{it.kcal}</td>
                      <td className="py-1.5 text-right">
                        {it.protein} / {it.carbs} / {it.fat}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[14px] font-semibold">{verdict}</p>
            </>
          )}
          <p className="mt-auto text-[11px] text-muted">Estimates from a demonstration model with simulated bounding boxes. Portions vary; not for medical use.</p>
        </Card>
      </div>
    </section>
  );
}

function Voucher() {
  const { voucher, redeemVoucher, voucherUsed, go } = useStore();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (voucherUsed) return setMsg({ ok: false, text: 'This welcome code is only valid on your first reservation.' });
    if (redeemVoucher(code)) setMsg({ ok: true, text: `${VOUCHER_DISCOUNT * 100}% off applied to your first meal.` });
    else setMsg({ ok: false, text: 'That code isn’t valid. Check for typos.' });
  }

  return (
    <section className="mt-16">
      <Card className="grid gap-6 bg-gradient-to-br from-pulse to-[#075c3a] text-white md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
        <div>
          <Ticket size={28} />
          <h3 className="headline mt-4 text-[30px] font-bold">Your first recovery meal, {VOUCHER_DISCOUNT * 100}% off.</h3>
          <p className="mt-2 text-[15px] text-white/75">
            New to ActiveNutri? Enter <span className="font-semibold text-white">{VOUCHER_CODE}</span> before your first reservation.
          </p>
        </div>
        {voucher ? (
          <div className="rounded-2xl bg-white/10 p-5">
            <p className="flex items-center gap-2 text-[16px] font-semibold">
              <Check size={18} /> {voucher} applied
            </p>
            <p className="mt-1 text-[13px] text-white/75">Discount shows on every meal until you reserve one.</p>
            <button onClick={() => go('nutrition')} className="mt-3 text-[13px] font-semibold underline">
              Pick a meal
            </button>
          </div>
        ) : (
          <form onSubmit={redeem} className="grid gap-2">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Promo code"
                aria-label="Promo code"
                className={cx(inputCls, 'border-white/20 bg-white/10 uppercase text-white placeholder:text-white/50 focus:border-white')}
              />
              <button type="submit" className="h-11 shrink-0 rounded-full bg-white px-5 text-[15px] font-semibold text-ink hover:bg-white/90">
                Redeem
              </button>
            </div>
            {msg && <p className={cx('text-[13px]', msg.ok ? 'text-white' : 'text-amber-200')}>{msg.text}</p>}
          </form>
        )}
      </Card>
    </section>
  );
}

export function Nutrition() {
  return (
    <>
      <MealBento />
      <Voucher />
      <SnapAndCalculate />
    </>
  );
}
