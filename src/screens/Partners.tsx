import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChefHat, CircleDollarSign, HandCoins, HeartHandshake, Landmark, MapPinned, Refrigerator, ShieldCheck, Trophy, Truck } from 'lucide-react';
import { Button, Card, Field, SectionHeader, inputCls, cx } from '../components/ui';
import { canvas, canvasTrace, type CanvasBlock } from '../data/bmc';
import { sgd } from '../lib/store';

const pillars = [
  {
    id: 'subs',
    name: 'Consumer Subscriptions',
    short: 'Subscriptions',
    icon: CircleDollarSign,
    color: '#0a7d4f',
    payer: 'Athletes, teams & academies',
    rate: 'S$0 · S$89 · S$1,000 / month',
    body: 'Recurring access to personalised meal ordering, nutrition support and the booking bot. Academy licences give clubs centralised athlete meal planning.',
  },
  {
    id: 'kitchen',
    name: 'Cloud Kitchen Commissions',
    short: 'Kitchens',
    icon: ChefHat,
    color: '#f5b83d',
    payer: 'SFA-licensed central & cloud kitchens',
    rate: '18% of each meal order',
    body: 'A margin on every meal based on preparation, nutritionist vetting and pod delivery value added — plus sponsored bundles that still meet approval standards.',
  },
  {
    id: 'therapist',
    name: 'Therapist / Nutritionist Cut',
    short: 'Therapists',
    icon: HeartHandshake,
    color: '#a78bfa',
    payer: 'Physios, massage therapists, nutritionists',
    rate: '12% per consult',
    body: 'Commission on AHPC physio, sports-massage and one-on-one nutritionist consults booked through the app, sold as premium add-ons.',
  },
  {
    id: 'venue',
    name: 'Venue Booking Fees',
    short: 'Venues',
    icon: Trophy,
    color: '#2f80ed',
    payer: 'Members using the booking bot',
    rate: 'S$0.80 per bot-secured booking',
    body: 'A convenience fee when the autonomous booking bot secures a released ActiveSG slot — the “commission cut for bots within the app” from the canvas.',
  },
];

function RevenueLoop() {
  const [active, setActive] = useState(pillars[0].id);
  const p = pillars.find((x) => x.id === active)!;
  const R = 38;
  return (
    <section>
      <SectionHeader
        eyebrow="BCM four-pillar circular revenue model"
        title="Every meal, booking and consult feeds the loop."
        sub="Members bring kitchens volume; kitchens fund pods; pods sit in venues; venues bring members. Tap a pillar."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <Card className="mx-auto w-full max-w-md">
          <svg viewBox="0 0 100 100" className="w-full" role="group" aria-label="Circular revenue model">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e5ea" strokeWidth="1" strokeDasharray="2 2" />
            {pillars.map((x, i) => {
              const a = (i / pillars.length) * Math.PI * 2 - Math.PI / 2;
              const a2 = ((i + 0.5) / pillars.length) * Math.PI * 2 - Math.PI / 2;
              const cx_ = 50 + R * Math.cos(a);
              const cy = 50 + R * Math.sin(a);
              return (
                <g key={x.id}>
                  <path d={`M ${50 + R * Math.cos(a2) - 1.5} ${50 + R * Math.sin(a2) - 1.5} l 1.5 1.5 l -1.5 1.5`} transform={`rotate(${(a2 * 180) / Math.PI + 90} ${50 + R * Math.cos(a2)} ${50 + R * Math.sin(a2)})`} fill="none" stroke="#aeaeb2" strokeWidth=".8" />
                  <g onClick={() => setActive(x.id)} className="cursor-pointer" role="button" tabIndex={0} aria-label={x.name} onKeyDown={(e) => e.key === 'Enter' && setActive(x.id)}>
                    <circle cx={cx_} cy={cy} r={active === x.id ? 11 : 9.5} fill={x.color} opacity={active === x.id ? 1 : 0.8} style={{ transition: 'r .2s' }} />
                    <text x={cx_} y={cy + 1.3} textAnchor="middle" fontSize="2.5" fontWeight="700" fill="#fff">
                      {x.short}
                    </text>
                  </g>
                </g>
              );
            })}
            <text x="50" y="48" textAnchor="middle" fontSize="5" fontWeight="800" fill="#1d1d1f" letterSpacing="-.2">
              ActiveNutri
            </text>
            <text x="50" y="55" textAnchor="middle" fontSize="3" fill="#6e6e73">
              + SG Sports startup grant
            </text>
          </svg>
        </Card>
        <Card key={p.id} className="anim-rise">
          <p.icon size={28} style={{ color: p.color }} />
          <h3 className="headline mt-4 text-[26px] font-bold">{p.name}</h3>
          <p className="mt-2 text-[15px] text-muted">{p.body}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-hair pt-4">
            <div>
              <dt className="text-[12px] text-muted">Who pays</dt>
              <dd className="text-[15px] font-semibold">{p.payer}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Rate</dt>
              <dd className="text-[15px] font-semibold tabular-nums">{p.rate}</dd>
            </div>
          </dl>
          <div className="mt-5 flex gap-2">
            {pillars.map((x) => (
              <button key={x.id} onClick={() => setActive(x.id)} aria-label={x.name} className={cx('h-1.5 flex-1 rounded-full', x.id === active ? '' : 'opacity-25')} style={{ background: x.color }} />
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

const stakeholders = [
  { id: 'sfa', name: 'SFA-licensed kitchens', icon: ChefHat, give: 'Grade-A meals portioned per athlete, daily', get: 'Predictable pre-order volume and pod distribution', span: 'md:col-span-2' },
  { id: 'hpb', name: 'Health Promotion Board', icon: ShieldCheck, give: 'Nutri-Grade and Healthier Choice standards', get: 'Population-level healthy-eating reach', span: '' },
  { id: 'asg', name: 'ActiveSG / Sport Singapore', icon: Landmark, give: 'Venue space for pods, court inventory', get: 'Higher utilisation, released-slot recovery', span: '' },
  { id: 'nutri', name: 'Board-certified nutritionists', icon: HeartHandshake, give: 'Menu vetting, plan updates, consults', get: 'Review fees and a consult marketplace', span: '' },
  { id: 'vend', name: 'Vending machine company', icon: Refrigerator, give: 'Dual-zone IoT lockers and maintenance', get: 'Hardware lease and service contract', span: '' },
  { id: 'logi', name: 'Delivery & logistics', icon: Truck, give: 'Timed drop-offs around training windows', get: 'Batched, routed restock runs', span: '' },
  { id: 'onemap', name: 'OneMap SG', icon: MapPinned, give: 'Authoritative GIS base map and geocoding', get: 'A showcase civic-data integration', span: 'md:col-span-2' },
];

function Stakeholders() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="Stakeholders" title="Built with Singapore’s wellness infrastructure." sub="Tap a card to see what each partner contributes and receives." />
      <div className="grid gap-3 md:grid-cols-4">
        {stakeholders.map((s) => {
          const isOpen = open === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setOpen(isOpen ? null : s.id)}
              aria-expanded={isOpen}
              className={cx('rounded-3xl bg-white p-5 text-left shadow-sm transition hover:shadow-md', s.span, isOpen && 'ring-2 ring-pulse')}
            >
              <s.icon size={22} />
              <p className="mt-6 text-[16px] font-semibold tracking-tight">{s.name}</p>
              {isOpen ? (
                <dl className="anim-fade mt-3 grid gap-2 text-[13px]">
                  <div>
                    <dt className="text-muted">Gives</dt>
                    <dd>{s.give}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Gets</dt>
                    <dd>{s.get}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-1 text-[13px] text-link">Details</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function UnitEconomics() {
  const [athletes, setAthletes] = useState(400);
  const [academies, setAcademies] = useState(3);
  const [mealsPer, setMealsPer] = useState(12);
  const m = useMemo(() => {
    const subs = athletes * 89 + academies * 1000;
    const kitchen = athletes * mealsPer * 12.3 * 0.18;
    const therapist = athletes * 0.15 * 70 * 0.12;
    const venue = athletes * 2 * 0.8;
    const revenue = subs + kitchen + therapist + venue;
    // From the Miro cost structure: marketing S$10,000, logistics S$3,000, hosting S$10.47/yr, store commission.
    const store = subs * 0.15;
    const costs = 10000 + 3000 + 10.47 / 12 + store + athletes * 0.6;
    return { subs, kitchen, therapist, venue, revenue, store, costs, net: revenue - costs };
  }, [athletes, academies, mealsPer]);
  const rows: [string, number][] = [
    ['Subscriptions', m.subs],
    ['Kitchen commissions', m.kitchen],
    ['Therapist cut', m.therapist],
    ['Venue booking fees', m.venue],
  ];
  const fmt = (n: number) => sgd(Math.round(n));
  return (
    <section className="mt-16">
      <SectionHeader eyebrow="Unit economics" title="Monthly revenue against the canvas cost structure." sub="Drag the sliders. Costs come straight from the Miro board: marketing, logistics, hosting and app-store commission." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="grid gap-4">
          <Field label={`Athlete members · ${athletes}`}>
            <input type="range" min={0} max={3000} step={50} value={athletes} onChange={(e) => setAthletes(+e.target.value)} className="accent-pulse" />
          </Field>
          <Field label={`Academy licences · ${academies}`}>
            <input type="range" min={0} max={30} value={academies} onChange={(e) => setAcademies(+e.target.value)} className="accent-pulse" />
          </Field>
          <Field label={`Meals per member per month · ${mealsPer}`}>
            <input type="range" min={0} max={30} value={mealsPer} onChange={(e) => setMealsPer(+e.target.value)} className="accent-pulse" />
          </Field>
        </Card>
        <Card>
          <dl className="grid gap-2 text-[14px] tabular-nums">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <dt className="w-40 text-muted">{k}</dt>
                <dd className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-pulse transition-all" style={{ width: `${m.revenue ? (v / m.revenue) * 100 : 0}%` }} />
                </dd>
                <dd className="w-24 text-right font-semibold">{fmt(v)}</dd>
              </div>
            ))}
          </dl>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-hair pt-4">
            <div>
              <dt className="text-[12px] text-muted">Revenue / mo</dt>
              <dd className="text-[20px] font-bold tabular-nums">{fmt(m.revenue)}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Costs / mo</dt>
              <dd className="text-[20px] font-bold tabular-nums">{fmt(m.costs)}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted">Net / mo</dt>
              <dd className={cx('text-[20px] font-bold tabular-nums', m.net < 0 ? 'text-alert' : 'text-pulse')}>{fmt(m.net)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] text-muted">
            Costs: marketing S$10,000 · logistics S$3,000 · hosting S$10.47/yr · 15% app-store cut on subscriptions ({fmt(m.store)}) · support S$0.60/member.
          </p>
        </Card>
      </div>
    </section>
  );
}

const tone: Record<CanvasBlock['tone'], string> = {
  green: 'bg-[#c6e88a]',
  teal: 'bg-[#9fe3dc]',
  violet: 'bg-[#c4b5fd]',
  yellow: 'bg-[#fdf08a]',
  pink: 'bg-[#f9c6e6]',
  sky: 'bg-[#a5daf7]',
  orange: 'bg-[#f7b67a]',
  stone: 'bg-[#ececec]',
  rose: 'bg-[#f5a3a3]',
};

function CanvasCell({ block, className }: { block: CanvasBlock; className?: string }) {
  const [more, setMore] = useState(false);
  return (
    <div className={cx('flex flex-col rounded-2xl border border-hair bg-white p-4', className)}>
      <h4 className="text-[17px] font-semibold tracking-tight">{block.title}</h4>
      <p className="text-[11px] text-muted">{block.prompt}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {(more ? [...block.headline, ...block.notes] : block.headline).map((n, i) => (
          <li
            key={n}
            className={cx('rounded-sm p-2 text-[11px] leading-snug text-ink shadow-[0_1px_2px_rgba(0,0,0,.12)]', tone[block.tone], i >= block.headline.length ? 'w-full' : 'max-w-[150px]')}
          >
            {n}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted">
        <span className="font-semibold text-ink">In the app:</span> {canvasTrace[block.id]}
      </p>
      <button onClick={() => setMore((m) => !m)} className="mt-2 self-start text-[12px] font-semibold text-link" aria-expanded={more}>
        {more ? 'Show fewer notes' : `Show all ${block.headline.length + block.notes.length} notes`}
      </button>
    </div>
  );
}

function BusinessModelCanvas() {
  const b = Object.fromEntries(canvas.map((c) => [c.id, c])) as Record<string, CanvasBlock>;
  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="Business Model Canvas · Miro workshop"
        title="Where this product came from."
        sub="The team’s Miro board, transcribed sticky-for-sticky. Each block notes the feature it became."
      />
      <div className="grid gap-3 lg:grid-cols-5">
        <CanvasCell block={b.partners} className="lg:row-span-2" />
        <CanvasCell block={b.activities} />
        <CanvasCell block={b.propositions} className="lg:row-span-2" />
        <CanvasCell block={b.relationships} />
        <CanvasCell block={b.segments} className="lg:row-span-2" />
        <CanvasCell block={b.resources} />
        <CanvasCell block={b.channels} />
        <CanvasCell block={b.costs} className="lg:col-span-2" />
        <CanvasCell block={b.revenue} className="lg:col-span-3" />
      </div>
    </section>
  );
}

type Inquiry = { type: string; org: string; contact: string; email: string; size: string; message: string; consent: boolean };

function InquiryPipeline() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Inquiry>({ type: '', org: '', contact: '', email: '', size: '1–10', message: '', consent: false });
  const [ref, setRef] = useState<string | null>(null);
  const set = <K extends keyof Inquiry>(k: K, v: Inquiry[K]) => setForm((f) => ({ ...f, [k]: v }));
  const types = [
    { id: 'kitchen', label: 'Cloud / central kitchen', icon: ChefHat },
    { id: 'club', label: 'Club, academy or team', icon: Trophy },
    { id: 'therapist', label: 'Therapist or nutritionist', icon: HeartHandshake },
    { id: 'venue', label: 'Gym or venue operator', icon: Landmark },
    { id: 'sponsor', label: 'Sponsor or grant body', icon: HandCoins },
  ];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canNext = step === 0 ? !!form.type : step === 1 ? form.org.trim() && form.contact.trim() && emailOk : form.consent;
  const steps = ['Partner type', 'Details', 'Review & send'];

  function submit() {
    const id = `PN-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setRef(id);
  }

  function reset() {
    setForm({ type: '', org: '', contact: '', email: '', size: '1–10', message: '', consent: false });
    setStep(0);
    setRef(null);
  }

  return (
    <section className="mt-16">
      <SectionHeader eyebrow="Partner inquiry" title="Partner with ActiveNutri." sub="Three steps. A partnerships lead replies within two working days." />
      <Card className="mx-auto max-w-2xl">
        <ol className="mb-6 grid grid-cols-3 gap-2">
          {steps.map((s, i) => (
            <li key={s} className="text-[12px]">
              <div className={cx('mb-1.5 h-1 rounded-full', i <= (ref ? 3 : step) ? 'bg-pulse' : 'bg-black/10')} />
              <span className={cx(i === step && !ref ? 'font-semibold text-ink' : 'text-muted')}>
                {i + 1}. {s}
              </span>
            </li>
          ))}
        </ol>

        {ref ? (
          <div className="anim-rise py-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pulse-soft text-pulse">
              <Check />
            </span>
            <h3 className="headline mt-4 text-[24px] font-bold">Inquiry received</h3>
            <p className="mt-1 text-[14px] text-muted">
              Reference <span className="font-semibold text-ink tabular-nums">{ref}</span>. In this demo your inquiry stays in this browser tab; nothing is sent or stored.
            </p>
            <Button variant="secondary" className="mt-5" onClick={reset}>
              Start another
            </Button>
          </div>
        ) : step === 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => set('type', t.id)}
                aria-pressed={form.type === t.id}
                className={cx('flex items-center gap-3 rounded-2xl border p-4 text-left text-[14px] font-medium transition', form.type === t.id ? 'border-pulse bg-pulse-soft' : 'border-hair hover:border-ink/30')}
              >
                <t.icon size={20} /> {t.label}
              </button>
            ))}
          </div>
        ) : step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Organisation">
              <input className={inputCls} value={form.org} onChange={(e) => set('org', e.target.value)} placeholder="e.g. Bishan Shuttlers" />
            </Field>
            <Field label="Contact name">
              <input className={inputCls} value={form.contact} onChange={(e) => set('contact', e.target.value)} />
            </Field>
            <Field label="Work email" hint={form.email && !emailOk ? 'Enter a valid email address' : undefined}>
              <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Athletes / staff">
              <select className={inputCls} value={form.size} onChange={(e) => set('size', e.target.value)}>
                {['1–10', '11–50', '51–200', '200+'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="What would you like to explore? (optional)">
                <textarea className={cx(inputCls, 'h-24 py-2.5')} value={form.message} onChange={(e) => set('message', e.target.value)} />
              </Field>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <dl className="grid gap-3 rounded-2xl bg-canvas p-4 text-[14px] sm:grid-cols-2">
              <div>
                <dt className="text-[12px] text-muted">Partner type</dt>
                <dd className="font-semibold">{types.find((t) => t.id === form.type)?.label}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Organisation</dt>
                <dd className="font-semibold">{form.org}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Contact</dt>
                <dd className="font-semibold">
                  {form.contact} · {form.email}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Size</dt>
                <dd className="font-semibold">{form.size}</dd>
              </div>
              {form.message && (
                <div className="sm:col-span-2">
                  <dt className="text-[12px] text-muted">Message</dt>
                  <dd>{form.message}</dd>
                </div>
              )}
            </dl>
            <label className="flex items-start gap-2 text-[13px] text-muted">
              <input type="checkbox" className="mt-0.5 accent-pulse" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />I consent to ActiveNutri using these details to respond to this inquiry, in line with the PDPA.
            </label>
          </div>
        )}

        {!ref && (
          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ArrowLeft size={16} /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={submit} disabled={!canNext}>
                Send inquiry
              </Button>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}

export function Partners() {
  return (
    <>
      <RevenueLoop />
      <Stakeholders />
      <UnitEconomics />
      <BusinessModelCanvas />
      <InquiryPipeline />
    </>
  );
}
