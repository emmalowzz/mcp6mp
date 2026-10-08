import { useEffect, useRef, useState } from 'react';
import { Bot, Check, Power, Users, Stethoscope } from 'lucide-react';
import { Button, Card, Drawer, Field, SectionHeader, Segmented, StatusDot, inputCls, cx } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { callTool, type BookingResult } from '../lib/mcp';
import { useStore } from '../lib/store';
import { meals, pods, venues, type Venue, type VenueId } from '../data/catalog';
import { MealArt } from '../components/MealArt';

const SLOTS = ['07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { iso, label: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric' }) };
  });
}

function seeded(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function useTicker(ms: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

function VenueDrawer({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const { open } = useStore();
  const days = nextDays(7);
  const [sport, setSport] = useState(venue.courts[0]);
  const [date, setDate] = useState(days[0].iso);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tick = useTicker(8000);
  const pod = pods.find((p) => p.id === venue.podId)!;

  const now = new Date();
  const isToday = date === days[0].iso;
  const avail = (slot: string) => {
    if (isToday && Number(slot.slice(0, 2)) <= now.getHours()) return 0;
    return seeded(`${venue.id}${sport}${date}${slot}${Math.floor(tick / 2) + (seeded(slot) % 3)}`) % 5;
  };

  const stock = meals.map((m, i) => ({ meal: m, count: Math.max(0, ((seeded(venue.id + m.id) + i) % 7) + 1 - (tick % (3 + i)) ) }));

  async function book(slot: string) {
    setPending(slot);
    setError(null);
    try {
      setBooking(await callTool<BookingResult>('activesg_book_court', { venue: venue.id, sport, date, slot, players: 2 }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <Drawer title={venue.name} onClose={onClose}>
      <p className="-mt-2 mb-5 text-[13px] text-muted">{venue.address} · live availability, refreshes every 8 s</p>

      <div className="grid gap-3">
        <Segmented label="Sport" value={sport} onChange={(s) => { setSport(s); setBooking(null); }} options={venue.courts.map((c) => ({ id: c, label: c }))} />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.iso}
              onClick={() => { setDate(d.iso); setBooking(null); }}
              className={cx('shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold', date === d.iso ? 'bg-ink text-white' : 'bg-black/5 text-ink')}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {SLOTS.map((s) => {
            const n = avail(s);
            return (
              <button
                key={s}
                disabled={n === 0 || pending !== null}
                onClick={() => book(s)}
                className={cx(
                  'rounded-xl border px-2 py-2 text-left transition',
                  n === 0 ? 'border-transparent bg-black/[.03] text-muted' : 'border-hair hover:border-pulse hover:bg-pulse-soft',
                  booking?.slot === s && booking.date === date && 'border-pulse bg-pulse-soft',
                )}
              >
                <span className="block text-[14px] font-semibold tabular-nums">{s}</span>
                <span className="text-[11px] tabular-nums">{pending === s ? 'Booking…' : n === 0 ? 'Full' : `${n} court${n > 1 ? 's' : ''}`}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="text-[13px] text-alert">{error}</p>}
        {booking && (
          <div className="rounded-2xl bg-pulse-soft p-4 text-[13px]">
            <p className="flex items-center gap-1.5 text-[15px] font-semibold text-pulse">
              <Check size={16} /> Booked {booking.court}, {booking.slot}
            </p>
            <p className="mt-1 tabular-nums">
              Ref {booking.reference} · {booking.sport} · {booking.date} · S${booking.fee_sgd.toFixed(2)}
            </p>
            <p className="mt-1 text-muted">{booking.note}</p>
          </div>
        )}
      </div>

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[15px] font-semibold">Smart Dispenser {pod.id}</h4>
          <span className="flex items-center gap-1.5 text-[12px] text-muted">
            <StatusDot state={pod.status === 'online' ? 'ok' : 'warn'} /> {pod.status}
          </span>
        </div>
        <ul className="divide-y divide-hair">
          {stock.map(({ meal, count }) => (
            <li key={meal.id} className="flex items-center gap-3 py-2.5">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <MealArt meal={meal.id} photo={meal.photo} alt="" />
              </span>
              <span className="flex-1 text-[14px]">{meal.name}</span>
              <span className={cx('w-10 text-right text-[15px] font-semibold tabular-nums', count === 0 && 'text-alert')}>{count}</span>
              <Button size="sm" variant="secondary" disabled={count === 0} onClick={() => open({ type: 'reserve', mealId: meal.id, podId: pod.id })}>
                Reserve
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
  );
}

type Session = { id: string; kind: 'sparring' | 'physio'; title: string; venue: VenueId; when: string; spots: number; host: string };

const sessions: Session[] = [
  { id: 's1', kind: 'sparring', title: 'Intermediate badminton doubles', venue: 'bishan', when: 'Tue 19:00', spots: 4, host: 'Bishan Shuttlers' },
  { id: 's2', kind: 'sparring', title: '3x3 basketball run', venue: 'kallang', when: 'Wed 20:00', spots: 6, host: 'Kallang Hoops' },
  { id: 's3', kind: 'sparring', title: 'Futsal friendly, 5-a-side', venue: 'jurong-east', when: 'Thu 21:00', spots: 3, host: 'JE United' },
  { id: 'p1', kind: 'physio', title: 'AHPC sports physio assessment (45 min)', venue: 'kallang', when: 'Mon 10:00', spots: 2, host: 'Active Health Performance Centre' },
  { id: 'p2', kind: 'physio', title: 'Recovery sports massage (30 min)', venue: 'clementi', when: 'Sat 09:00', spots: 3, host: 'Partner therapist' },
  { id: 'p3', kind: 'physio', title: 'Strength & mobility screen', venue: 'bishan', when: 'Fri 18:00', spots: 1, host: 'Active Health Performance Centre' },
];

function Community() {
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [kind, setKind] = useState<'all' | 'sparring' | 'physio'>('all');
  const list = sessions.filter((s) => kind === 'all' || s.kind === kind);
  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="Community sparring & AHPC physio"
        title="Find a game. Fix what hurts."
        right={<Segmented label="Session type" value={kind} onChange={setKind} options={[{ id: 'all', label: 'All' }, { id: 'sparring', label: 'Sparring' }, { id: 'physio', label: 'Physio' }]} />}
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => {
          const isJoined = joined[s.id];
          const left = s.spots - (isJoined ? 1 : 0);
          return (
            <Card key={s.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[12px] text-muted">
                {s.kind === 'sparring' ? <Users size={14} /> : <Stethoscope size={14} />}
                {s.kind === 'sparring' ? 'Community sparring' : 'AHPC physio'} · {venues.find((v) => v.id === s.venue)!.short}
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight">{s.title}</h3>
              <p className="text-[13px] text-muted">
                {s.host} · <span className="tabular-nums">{s.when}</span> · <span className="tabular-nums">{left}</span> spot{left === 1 ? '' : 's'} left
              </p>
              <Button
                size="sm"
                className="mt-auto self-start"
                variant={isJoined ? 'secondary' : 'primary'}
                disabled={!isJoined && left === 0}
                onClick={() => setJoined((j) => ({ ...j, [s.id]: !j[s.id] }))}
              >
                {isJoined ? (
                  <>
                    <Check size={14} /> {s.kind === 'sparring' ? 'Joined — leave' : 'Booked — cancel'}
                  </>
                ) : s.kind === 'sparring' ? (
                  'Join session'
                ) : (
                  'Book appointment'
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

type Log = { t: string; text: string; tone?: 'ok' | 'warn' | 'err' };

function BookingBot() {
  const [venue, setVenue] = useState<VenueId>('bishan');
  const [sport, setSport] = useState('Badminton');
  const [day, setDay] = useState(nextDays(7)[3].iso);
  const [slot, setSlot] = useState('19:00');
  const [state, setState] = useState<'idle' | 'arming' | 'armed' | 'booked'>('idle');
  const [log, setLog] = useState<Log[]>([{ t: '--:--:--', text: 'Bot idle. Configure a target slot and arm.' }]);
  const timers = useRef<number[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const v = venues.find((x) => x.id === venue)!;

  const push = (text: string, tone?: Log['tone']) =>
    setLog((l) => [...l.slice(-40), { t: new Date().toLocaleTimeString('en-SG', { hour12: false }), text, tone }]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!v.courts.includes(sport)) setSport(v.courts[0]);
  }, [v, sport]);

  function disarm() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setState('idle');
    push('Bot disarmed by user.', 'warn');
  }

  function arm() {
    setState('arming');
    push(`Arming bot → ${v.name}, ${sport}, ${day} ${slot}`);
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(500, () => {
      setState('armed');
      push('Armed. Watching ActiveSG release queue via /api/mcp…', 'ok');
    });
    at(2500, () => push('Polling… target slot full (0 courts).'));
    at(4500, () => push('Polling… target slot full (0 courts).'));
    at(6500, async () => {
      push('Cancellation detected! 1 court released. Booking…', 'warn');
      try {
        const r = await callTool<BookingResult>('activesg_book_court', { venue, sport, date: day, slot, players: 2 });
        push(`Booked ${r.court} · ref ${r.reference} · S$${r.fee_sgd.toFixed(2)}`, 'ok');
        setState('booked');
      } catch (e) {
        push(`Booking failed: ${(e as Error).message}`, 'err');
        setState('idle');
      }
    });
  }

  const busy = state === 'arming' || state === 'armed';
  const stateLabel = { idle: 'Disarmed', arming: 'Arming…', armed: 'Armed — watching', booked: 'Slot secured' }[state];

  return (
    <section className="mt-16">
      <SectionHeader
        eyebrow="Autonomous Court Booking Bot"
        title="Set it. Arm it. Get the court."
        sub="The bot watches for released slots and books through the activesg_book_court MCP tool. Fair-use: one armed target per sport per day."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="grid gap-3">
          <Field label="Venue">
            <select className={inputCls} value={venue} disabled={busy} onChange={(e) => setVenue(e.target.value as VenueId)}>
              {venues.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sport">
              <select className={inputCls} value={sport} disabled={busy} onChange={(e) => setSport(e.target.value)}>
                {v.courts.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Start">
              <select className={inputCls} value={slot} disabled={busy} onChange={(e) => setSlot(e.target.value)}>
                {SLOTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Date">
            <select className={inputCls} value={day} disabled={busy} onChange={(e) => setDay(e.target.value)}>
              {nextDays(7).map((d) => (
                <option key={d.iso} value={d.iso}>
                  {d.label} · {d.iso}
                </option>
              ))}
            </select>
          </Field>
          {busy ? (
            <Button variant="danger" onClick={disarm}>
              <Power size={16} /> Disarm bot
            </Button>
          ) : (
            <Button onClick={arm}>
              <Bot size={16} /> {state === 'booked' ? 'Arm again' : 'Arm bot'}
            </Button>
          )}
        </Card>
        <div className="flex flex-col overflow-hidden rounded-3xl bg-[#111214] text-[12px] text-zinc-300">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <StatusDot state={state === 'armed' ? 'ok' : state === 'booked' ? 'ok' : state === 'arming' ? 'warn' : 'idle'} />
            <span className="font-semibold text-white">{stateLabel}</span>
            <span className="ml-auto font-mono text-zinc-500">bot@activenutri</span>
          </div>
          <div ref={logRef} className="h-64 overflow-y-auto p-4 font-mono leading-relaxed" aria-live="polite">
            {log.map((l, i) => (
              <p key={i} className={cx(l.tone === 'ok' && 'text-emerald-400', l.tone === 'warn' && 'text-amber-300', l.tone === 'err' && 'text-red-400')}>
                <span className="text-zinc-500 tabular-nums">{l.t}</span> {l.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Venues() {
  const [selected, setSelected] = useState<VenueId | null>(null);
  const venue = venues.find((v) => v.id === selected);
  return (
    <>
      <SectionHeader
        eyebrow="Sports venues"
        title="Every ActiveSG court. One app."
        sub="Tap a venue pin to see live court availability and what’s stocked in its Smart Dispenser."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="p-2! sm:p-2!">
          <MapCanvas
            className="aspect-[100/58]"
            selected={selected}
            onSelect={(id) => setSelected(id as VenueId)}
            pins={venues.map((v) => ({ id: v.id, lat: v.lat, lng: v.lng, label: v.short }))}
          />
        </Card>
        <div className="grid gap-3">
          {venues.map((v) => (
            <button key={v.id} onClick={() => setSelected(v.id)} className="rounded-2xl bg-white p-4 text-left shadow-sm transition hover:shadow-md">
              <p className="text-[16px] font-semibold tracking-tight">{v.name}</p>
              <p className="text-[12px] text-muted">
                {v.courts.join(' · ')} · Pod {v.podId}
              </p>
            </button>
          ))}
        </div>
      </div>
      {venue && <VenueDrawer key={venue.id} venue={venue} onClose={() => setSelected(null)} />}
      <BookingBot />
      <Community />
    </>
  );
}
