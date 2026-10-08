import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calculator, Check, Droplets, Flame, HeartPulse, LocateFixed, MapPin, Refrigerator, Salad, Search, Zap } from 'lucide-react';
import { Button, Card, Donut, Field, MacroLegend, SectionHeader, Segmented, inputCls, cx } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { useStore, sgd } from '../lib/store';
import { callTool, type RecoveryResult } from '../lib/mcp';
import { ATHLETE_PER_MEAL, avgMealPrice, distanceKm, mealById, meals, pods, tiers, venues, type MealId, type Region, type VenueId } from '../data/catalog';
import { MealArt } from '../components/MealArt';
import { MealCard } from '../components/MealCard';

type Phase = 'training' | 'recovery';

function useBiometrics(phase: Phase) {
  const target = phase === 'training' ? { hr: 158, hrv: 38, gly: 54, hyd: 91, temp: 37.6, load: 412 } : { hr: 72, hrv: 64, gly: 71, hyd: 96, temp: 36.8, load: 388 };
  const [state, setState] = useState(() => ({ v: target, hrHistory: Array<number>(40).fill(target.hr) }));
  useEffect(() => {
    const t = setInterval(() => {
      setState(({ v: p, hrHistory }) => {
        const step = (cur: number, goal: number, jitter: number) => cur + (goal - cur) * 0.18 + (Math.random() - 0.5) * jitter;
        const next = {
          hr: step(p.hr, target.hr, 4),
          hrv: step(p.hrv, target.hrv, 2),
          gly: Math.max(0, step(p.gly, target.gly, 0.4)),
          hyd: Math.min(100, step(p.hyd, target.hyd, 0.3)),
          temp: step(p.temp, target.temp, 0.05),
          load: step(p.load, target.load, 1.5),
        };
        return { v: next, hrHistory: [...hrHistory.slice(1), next.hr] };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [target.hr, target.hrv, target.gly, target.hyd, target.temp, target.load]);
  return state;
}

function Hero() {
  const { open, go, profile } = useStore();
  const [phase, setPhase] = useState<Phase>('training');
  const { v, hrHistory } = useBiometrics(phase);
  const max = 190;
  const metrics = [
    { label: 'Glycogen', value: v.gly.toFixed(0), unit: '%', icon: Zap },
    { label: 'Hydration', value: v.hyd.toFixed(0), unit: '%', icon: Droplets },
    { label: 'HRV', value: v.hrv.toFixed(0), unit: 'ms', icon: HeartPulse },
    { label: 'Core temp', value: v.temp.toFixed(1), unit: '°C', icon: Flame },
  ];
  return (
    <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div>
        <p className="eyebrow text-pulse">Singapore sports nutrition &amp; recovery</p>
        <h1 className="headline mt-3 text-[44px] font-extrabold sm:text-[60px]">
          Recovery meals,
          <br />
          waiting where you train.
        </h1>
        <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted">
          Healthy food at your fingertips, without the hassle of meal prepping alone. Order a nutritionist-vetted meal before you play, then tap your phone
          on the Smart Dispenser at your ActiveSG venue to collect it, chilled or hot.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => go('nutrition')}>
            Order a meal <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
            See plans from {sgd(Math.round(ATHLETE_PER_MEAL * 100) / 100)}/meal
          </Button>
        </div>
        <ul className="mt-6 grid gap-1.5 text-[14px] text-muted sm:grid-cols-2">
          {['SFA Grade-A kitchens', 'Vetted by nutritionists', '48 pods at ActiveSG venues', 'First meal 30% off'].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check size={15} className="text-pulse" /> {t}
            </li>
          ))}
        </ul>
        <button onClick={() => open({ type: 'start' })} className="mt-4 text-[14px] font-semibold text-link hover:underline">
          {profile ? 'Edit my profile' : 'New here? Set up your profile with Singpass'}
        </button>
      </div>

      <Card className="relative overflow-hidden bg-ink! text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-white/60">Live biometric telemetry</p>
            <p className="text-[13px] text-white/80">{profile ? profile.name : 'Demo athlete'} · simulated wearable stream</p>
          </div>
          <div className="inline-flex rounded-lg bg-white/10 p-0.5 text-[12px]">
            {(['training', 'recovery'] as Phase[]).map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                aria-pressed={phase === p}
                className={cx('rounded-md px-2.5 py-1 font-medium capitalize', phase === p ? 'bg-white text-ink' : 'text-white/70')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-end gap-2">
          <span className="headline text-[72px] font-bold tabular-nums">{Math.round(v.hr)}</span>
          <span className="mb-3 text-[15px] text-white/60">bpm</span>
          <span className="mb-3 ml-auto text-right text-[12px] text-white/60 tabular-nums">
            Zone {v.hr > 152 ? 4 : v.hr > 133 ? 3 : v.hr > 114 ? 2 : 1}
            <br />
            Load {Math.round(v.load)} TRIMP
          </span>
        </div>
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-14 w-full" aria-hidden>
          <polyline
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            points={hrHistory.map((h, i) => `${(i / (hrHistory.length - 1)) * 100},${24 - (h / max) * 24}`).join(' ')}
          />
        </svg>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl bg-white/[.07] p-3">
              <dt className="flex items-center gap-1 text-[11px] text-white/60">
                <m.icon size={12} /> {m.label}
              </dt>
              <dd className="mt-1 text-[22px] font-semibold tabular-nums">
                {m.value}
                <span className="ml-0.5 text-[12px] font-normal text-white/60">{m.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[12px] text-white/60">
          {phase === 'training'
            ? 'Glycogen dropping — recovery window opens when you stop.'
            : 'Recovery window open: eat within 30–60 min for best glycogen resynthesis.'}
        </p>
      </Card>
    </section>
  );
}

function MenuStrip() {
  const { go } = useStore();
  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="On the menu today"
        title="Hungry yet?"
        sub="Four chef-made recovery meals, each one portioned for the hour after training."
        right={
          <Button variant="secondary" size="sm" onClick={() => go('nutrition')}>
            Full menu <ArrowRight size={14} />
          </Button>
        }
      />
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {meals.map((m) => (
          <MealCard key={m.id} meal={m} compact className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-auto" />
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Salad, title: 'Pick your meal', body: 'Choose from the menu, or let the recovery calculator pick for your session.' },
    { icon: MapPin, title: 'Choose your pod', body: 'Select the Smart Dispenser at the venue where you train. We stock it before you arrive.' },
    { icon: Refrigerator, title: 'Tap to collect', body: 'Hold your phone to the pod after training. Your locker opens with your meal chilled or hot.' },
  ];
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="How it works" title="Order in 30 seconds. Collect in 5." />
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((st, i) => (
          <li key={st.title} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-pulse text-[15px] font-bold text-white tabular-nums">{i + 1}</span>
              <st.icon size={22} className="text-pulse" />
            </div>
            <h3 className="mt-4 text-[19px] font-bold tracking-tight">{st.title}</h3>
            <p className="mt-1 text-[15px] text-muted">{st.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Pillars() {
  const { go } = useStore();
  const pillars = [
    { id: 'nutrition' as const, title: 'Nutrition', body: 'SFA Grade-A recovery meals, vetted by board-certified nutritionists.', icon: Salad, tint: 'bg-[#fff6dd]', span: 'md:col-span-2' },
    { id: 'calc' as const, title: 'Recovery', body: 'Macros matched to your session load, sweat rate and goal.', icon: Calculator, tint: 'bg-pulse-soft', span: '' },
    { id: 'venues' as const, title: 'Venues', body: 'Book ActiveSG courts, sparring and AHPC physio — or let the bot do it.', icon: MapPin, tint: 'bg-[#e7f1fd]', span: '' },
    { id: 'dispensers' as const, title: 'Dispensers', body: '48 dual-zone pods: Cryo 4°C and Thermal 65°C, unlatched by NFC or QR.', icon: Refrigerator, tint: 'bg-[#f2ecff]', span: 'md:col-span-2' },
  ];
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="The ecosystem" title="Four pillars, one tap each." />
      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map((p) => (
          <button
            key={p.id}
            onClick={() => (p.id === 'calc' ? document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' }) : go(p.id))}
            className={cx('group rounded-3xl p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg', p.tint, p.span)}
          >
            <p.icon size={26} className="text-ink" />
            <h3 className="headline mt-8 text-[24px] font-bold">{p.title}</h3>
            <p className="mt-1 text-[15px] text-muted">{p.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-link">
              Open <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function RecoveryCalculator() {
  const { open } = useStore();
  const [weight, setWeight] = useState(68);
  const [duration, setDuration] = useState(75);
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high' | 'max'>('high');
  const [goal, setGoal] = useState<'recover' | 'build' | 'lean'>('recover');
  const [venue, setVenue] = useState<VenueId>('bishan');
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const v = venues.find((x) => x.id === venue)!;
  const pod = pods.find((p) => p.id === v.podId)!;

  async function calculate() {
    setLoading(true);
    setError(null);
    try {
      setResult(await callTool<RecoveryResult>('calculate_recovery_macros', { weight_kg: weight, duration_min: duration, intensity, goal }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const meal = result ? mealById(result.recommended_meal) : null;

  return (
    <section id="calculator" className="mt-16 scroll-mt-20">
      <SectionHeader
        eyebrow="Post-workout recovery calculator"
        title="What should you eat after today’s session?"
        sub="Computed server-side by the calculate_recovery_macros MCP tool, then matched to a meal waiting in the pod at your venue."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <div className="grid gap-4">
            <Field label={`Body mass · ${weight} kg`}>
              <input type="range" min={35} max={130} value={weight} onChange={(e) => setWeight(+e.target.value)} className="accent-pulse" />
            </Field>
            <Field label={`Session length · ${duration} min`}>
              <input type="range" min={15} max={240} step={5} value={duration} onChange={(e) => setDuration(+e.target.value)} className="accent-pulse" />
            </Field>
            <div className="grid gap-1.5">
              <span className="text-[13px] font-medium text-muted">Intensity</span>
              <Segmented
                label="Intensity"
                value={intensity}
                onChange={setIntensity}
                options={[
                  { id: 'low', label: 'Easy' },
                  { id: 'moderate', label: 'Moderate' },
                  { id: 'high', label: 'Hard' },
                  { id: 'max', label: 'Race' },
                ]}
              />
            </div>
            <div className="grid gap-1.5">
              <span className="text-[13px] font-medium text-muted">Goal</span>
              <Segmented
                label="Goal"
                value={goal}
                onChange={setGoal}
                options={[
                  { id: 'recover', label: 'Recover' },
                  { id: 'build', label: 'Build muscle' },
                  { id: 'lean', label: 'Lean out' },
                ]}
              />
            </div>
            <Field label="Training at">
              <select value={venue} onChange={(e) => setVenue(e.target.value as VenueId)} className={inputCls}>
                {venues.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button onClick={calculate} disabled={loading}>
              {loading ? 'Calculating…' : 'Calculate my recovery'}
            </Button>
            {error && <p className="text-[13px] text-alert">Couldn’t reach /api/mcp: {error}</p>}
          </div>
        </Card>

        <Card className="flex flex-col gap-5">
          {result && meal ? (
            <>
              <div className="flex flex-wrap items-center gap-6">
                <Donut
                  protein={result.targets.protein_g}
                  carbs={result.targets.carbs_g}
                  fat={result.targets.fat_g}
                  size={132}
                  center={
                    <div>
                      <div className="text-[24px] font-bold tabular-nums">{result.targets.kcal}</div>
                      <div className="text-[11px] text-muted">kcal target</div>
                    </div>
                  }
                />
                <div className="min-w-[150px] flex-1">
                  <MacroLegend protein={result.targets.protein_g} carbs={result.targets.carbs_g} fat={result.targets.fat_g} />
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-hair pt-3 text-[13px]">
                    <div>
                      <dt className="text-muted">Fluid</dt>
                      <dd className="font-semibold tabular-nums">{result.targets.fluid_ml.toLocaleString()} ml</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Sodium</dt>
                      <dd className="font-semibold tabular-nums">{result.targets.sodium_mg.toLocaleString()} mg</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <p className="text-[13px] text-muted">{result.window}</p>
              <div className="flex flex-col gap-4 rounded-2xl bg-canvas p-4 sm:flex-row sm:items-center">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <MealArt meal={meal.id} photo={meal.photo} alt="" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] text-muted">Recommended · waiting at {pod.id}</p>
                  <p className="text-[16px] font-semibold">{meal.name}</p>
                  <p className="text-[12px] text-muted tabular-nums">
                    {meal.protein} g protein · {meal.carbs} g carbs · {sgd(meal.priceSgd)}
                  </p>
                </div>
                <Button size="sm" onClick={() => open({ type: 'reserve', mealId: meal.id as MealId, podId: pod.id })}>
                  Reserve at pod
                </Button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center py-6 text-center text-[15px] text-muted">
              <div>
                <Calculator className="mx-auto mb-3" />
                Set your session and tap <span className="font-semibold text-ink">Calculate</span>.
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-[12px] text-muted">
              Pickup: <span className="font-semibold text-ink">{pod.name}</span> ({pod.id}) · {pod.stock}/{pod.capacity} meals in stock
            </p>
            <MapCanvas
              className="aspect-[100/58]"
              selected={v.id}
              focus={{ lat: v.lat, lng: v.lng }}
              pins={venues.map((x) => ({ id: x.id, lat: x.lat, lng: x.lng, label: x.short, tone: x.id === v.id ? 'pulse' : 'muted' }))}
              onSelect={(id) => setVenue(id as VenueId)}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}

function PodLocator() {
  const { go } = useStore();
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const list = useMemo(() => {
    let l = pods.filter((p) => (region === 'All' || p.region === region) && p.name.toLowerCase().includes(q.toLowerCase()));
    if (me) l = [...l].sort((a, b) => distanceKm(me.lat, me.lng, a.lat, a.lng) - distanceKm(me.lat, me.lng, b.lat, b.lng));
    return l;
  }, [q, region, me]);

  function locate() {
    setLocMsg('Locating…');
    const fallback = () => {
      setMe({ lat: 1.3521, lng: 103.8198 });
      setLocMsg('Location unavailable — sorted from the island centre instead.');
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocMsg('Sorted by distance from you. Your location stays on this device.');
      },
      fallback,
      { timeout: 6000 },
    );
  }

  const shown = list.slice(0, 8);

  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="Island-wide pod locator"
        title={`${pods.length} Smart Dispenser pods.`}
        sub="Every pod sits inside an ActiveSG venue or partner gym, so your meal is where you train."
        right={
          <Button variant="secondary" size="sm" onClick={() => go('dispensers')}>
            Full directory <ArrowRight size={14} />
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Tampines, Bishan…" className={cx(inputCls, 'pl-9')} aria-label="Search pods" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={region} onChange={(e) => setRegion(e.target.value as Region | 'All')} className={cx(inputCls, 'h-9 w-auto text-[13px]')} aria-label="Region">
              {['All', 'North', 'North-East', 'East', 'West', 'Central'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={locate}>
              <LocateFixed size={14} /> Near me
            </Button>
          </div>
          {locMsg && <p className="text-[12px] text-muted">{locMsg}</p>}
          <ul className="divide-y divide-hair">
            {shown.map((p) => (
              <li key={p.id}>
                <button onClick={() => setSelected(p.id)} className={cx('flex w-full items-center gap-3 py-2.5 text-left', selected === p.id && 'text-pulse')}>
                  <span className="w-14 text-[12px] font-semibold text-muted tabular-nums">{p.id}</span>
                  <span className="flex-1 text-[14px] font-medium">{p.name}</span>
                  <span className="text-[12px] text-muted tabular-nums">
                    {me ? `${distanceKm(me.lat, me.lng, p.lat, p.lng).toFixed(1)} km` : p.status === 'online' ? `${p.stock} meals` : p.status}
                  </span>
                </button>
              </li>
            ))}
            {!shown.length && <li className="py-6 text-center text-[14px] text-muted">No pods match.</li>}
          </ul>
          {list.length > shown.length && <p className="text-[12px] text-muted">+{list.length - shown.length} more in the directory</p>}
        </Card>
        <Card className="min-w-0 self-start p-2! sm:p-2!">
          <MapCanvas
            className="aspect-[100/58]"
            showLabels={false}
            selected={selected}
            onSelect={setSelected}
            pins={[
              ...list.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, label: p.name, tone: (p.status === 'online' ? 'pulse' : 'warn') as 'pulse' | 'warn' })),
              ...(me ? [{ id: 'me', lat: me.lat, lng: me.lng, label: 'You', tone: 'user' as const }] : []),
            ]}
          />
          {selected && selected !== 'me' && (
            <p className="px-3 py-2 text-[13px]">
              <span className="font-semibold">{pods.find((p) => p.id === selected)?.name}</span>{' '}
              <span className="text-muted">· {pods.find((p) => p.id === selected)?.stock} meals in stock</span>
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}

function Tiers() {
  const { open, profile } = useStore();
  return (
    <section id="plans" className="mt-16 scroll-mt-20">
      <SectionHeader
        eyebrow="Membership"
        title="Pick the plan that matches your training."
        sub="From people just starting healthier habits to clubs fuelling a whole squad."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => {
          const current = profile?.tier === t.id;
          const featured = t.id === 'athlete';
          return (
            <Card key={t.id} className={cx('flex flex-col', featured && 'ring-2 ring-pulse')}>
              <p className="text-[13px] font-semibold text-muted">{featured ? 'Most popular' : t.id === 'academy' ? 'For teams & clubs' : 'Start here'}</p>
              <h3 className="headline mt-1 text-[26px] font-bold">{t.name}</h3>
              <p className="mt-3">
                <span className="headline text-[40px] font-bold tabular-nums">{sgd(t.price)}</span>
                <span className="text-[14px] text-muted"> / {t.period}</span>
              </p>
              {t.id === 'athlete' && (
                <p className="mt-1 text-[14px] font-semibold text-pulse tabular-nums">
                  = {sgd(Math.round(ATHLETE_PER_MEAL * 100) / 100)} per meal · save {Math.round((1 - ATHLETE_PER_MEAL / avgMealPrice) * 100)}% vs ordering singly
                </p>
              )}
              {t.id === 'athlete' && (
                <div className="mt-3 flex -space-x-3">
                  {meals.map((m) => (
                    <div key={m.id} className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white">
                      <MealArt meal={m.id} photo={m.photo} alt="" />
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[14px] text-muted">{t.audience}</p>
              <ul className="mt-5 grid flex-1 gap-2 text-[14px]">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-pulse" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6" variant={featured ? 'primary' : 'secondary'} onClick={() => open({ type: 'start', tier: t.id })} disabled={current}>
                {current ? 'Your current plan' : t.price === 0 ? 'Join free' : `Choose ${t.name}`}
              </Button>
              <p className="mt-2 text-center text-[12px] text-muted">{t.price === 0 ? 'No card needed' : 'Cancel anytime · first meal 30% off'}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function Overview() {
  return (
    <>
      <Hero />
      <MenuStrip />
      <HowItWorks />
      <Pillars />
      <RecoveryCalculator />
      <PodLocator />
      <Tiers />
    </>
  );
}
