import { useEffect, useMemo, useState } from 'react';
import { Droplets, Plus, Sparkles, Trash2, Wheat } from 'lucide-react';
import { Button, Card, Donut, Field, MacroLegend, SectionHeader, Segmented, Sparkline, inputCls, cx } from '../components/ui';
import { MealArt } from '../components/MealArt';
import { getTargets, lookupFood, planDay, scoreDay, type FoodEntry, type PlanResult, type ScoreResult, type Stats, type TargetsResult } from '../lib/api';
import { sgd, useStore } from '../lib/store';
import { meals } from '../data/catalog';

// Saved in this browser only (PDPA: nothing is stored on our servers).
const KEY = 'activenutri.needs.v1';
type Saved = { stats: Stats; result: TargetsResult | null; logs: Record<string, FoodEntry[]>; weights: { date: string; kg: number }[] };

const today = () => new Date().toLocaleDateString('en-CA');

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

const DEFAULT_STATS: Stats = { age: 28, sex: 'female', heightCm: 165, weightKg: 58, activity: 'moderate', trainingMin: 60, goal: 'maintain', diet: 'balanced' };

const ACTIVITY: { id: Stats['activity']; label: string; hint: string }[] = [
  { id: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise' },
  { id: 'light', label: 'Lightly active', hint: 'Exercise 1–3 days a week' },
  { id: 'moderate', label: 'Moderately active', hint: 'Exercise 3–5 days a week' },
  { id: 'active', label: 'Very active', hint: 'Hard training 6–7 days a week' },
  { id: 'very_active', label: 'Athlete', hint: 'Twice-a-day training or physical job' },
];

function SourceLine({ source, tool }: { source: 'nutribalance' | 'estimate'; tool?: string }) {
  return source === 'nutribalance' ? (
    <p className="text-[12px] text-pulse">Calculated by NutriBalance{tool ? ` · ${tool.replace(/_/g, ' ')}` : ''}</p>
  ) : (
    <p className="text-[12px] text-muted">ActiveNutri estimate. NutriBalance is unavailable right now, so we used standard formulas (Mifflin-St Jeor).</p>
  );
}

function Bar({ label, value, goal, unit, max }: { label: string; value: number; goal: number; unit: string; max?: boolean }) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  const over = max ? value > goal : value > goal * 1.1;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted">
          <span className={cx('font-semibold', over ? 'text-alert' : 'text-ink')}>{Math.round(value).toLocaleString()}</span> / {Math.round(goal).toLocaleString()} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5">
        <div className={cx('h-full rounded-full transition-all duration-500', over ? 'bg-alert' : 'bg-pulse')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DailyNeeds() {
  const { open } = useStore();
  const saved = useMemo(load, []);
  const [stats, setStats] = useState<Stats>(saved?.stats ?? DEFAULT_STATS);
  const [result, setResult] = useState<TargetsResult | null>(saved?.result ?? null);
  const [logs, setLogs] = useState<Record<string, FoodEntry[]>>(saved?.logs ?? {});
  const [weights, setWeights] = useState(saved?.weights ?? []);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [foodQ, setFoodQ] = useState('');
  const [grams, setGrams] = useState(250);
  const [foodMsg, setFoodMsg] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);

  const log = logs[today()] ?? [];
  const t = result?.targets;

  useEffect(() => save({ stats, result, logs, weights }), [stats, result, logs, weights]);

  const set = <K extends keyof Stats>(k: K, v: Stats[K]) => setStats((s) => ({ ...s, [k]: v }));

  async function calculate(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy('targets');
    setError(null);
    try {
      const r = await getTargets(stats);
      setResult(r);
      setScore(null);
      setPlan(null);
      setWeights((w) => [...w.filter((x) => x.date !== today()), { date: today(), kg: stats.weightKg }].slice(-60));
      requestAnimationFrame(() => document.getElementById('targets')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const addEntry = (entry: FoodEntry) => {
    setLogs((l) => ({ ...l, [today()]: [...(l[today()] ?? []), entry] }));
    setScore(null);
  };

  async function addFood(e: React.FormEvent) {
    e.preventDefault();
    if (!foodQ.trim()) return;
    setBusy('food');
    setFoodMsg(null);
    try {
      const r = await lookupFood(foodQ, grams);
      addEntry(r.food);
      setFoodMsg(`Added ${r.food.grams} g ${r.food.name} · ${r.food.kcal} kcal${r.source === 'nutribalance' ? ' (NutriBalance)' : ''}`);
      setFoodQ('');
    } catch (err) {
      setFoodMsg((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runScore() {
    if (!t) return;
    setBusy('score');
    try {
      setScore(await scoreDay(stats, t, log));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runPlan() {
    if (!t) return;
    setBusy('plan');
    try {
      setPlan(await planDay(stats, t));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const totals = log.reduce(
    (a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat, fibre: a.fibre + e.fibre, sodium: a.sodium + e.sodium }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0 },
  );
  const left = t ? Math.max(0, t.kcal - totals.kcal) : 0;
  const fits = t
    ? meals
        .filter((m) => m.kcal <= left + 50)
        .filter((m) => (stats.diet === 'vegan' || stats.diet === 'vegetarian' ? m.tags.includes('plant-based') : true))
        .sort((a, b) => b.protein - a.protein)
        .slice(0, 2)
    : [];

  return (
    <>
      <SectionHeader
        eyebrow="My daily needs"
        title="Know exactly what your body needs today."
        sub="Enter your stats once. We work out your daily calories, macros, water and key nutrients, then help you track what you eat against them."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Card>
          <form onSubmit={calculate} className="grid gap-4">
            <h3 className="text-[17px] font-semibold tracking-tight">Your stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Age">
                <input className={inputCls} type="number" inputMode="numeric" min={13} max={100} value={stats.age} onChange={(e) => set('age', +e.target.value)} />
              </Field>
              <Field label="Height (cm)">
                <input className={inputCls} type="number" inputMode="numeric" min={120} max={230} value={stats.heightCm} onChange={(e) => set('heightCm', +e.target.value)} />
              </Field>
              <Field label="Weight (kg)">
                <input className={inputCls} type="number" inputMode="decimal" step="0.1" min={30} max={250} value={stats.weightKg} onChange={(e) => set('weightKg', +e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-1.5">
              <span className="text-[13px] font-medium text-muted">Sex</span>
              <Segmented label="Sex" value={stats.sex} onChange={(v) => set('sex', v)} options={[{ id: 'female', label: 'Female' }, { id: 'male', label: 'Male' }]} />
            </div>
            <Field label="Activity level" hint={ACTIVITY.find((a) => a.id === stats.activity)?.hint}>
              <select className={inputCls} value={stats.activity} onChange={(e) => set('activity', e.target.value as Stats['activity'])}>
                {ACTIVITY.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Training today · ${stats.trainingMin} min`}>
              <input type="range" min={0} max={240} step={5} value={stats.trainingMin} onChange={(e) => set('trainingMin', +e.target.value)} className="accent-pulse" />
            </Field>
            <div className="grid gap-1.5">
              <span className="text-[13px] font-medium text-muted">Goal</span>
              <Segmented label="Goal" value={stats.goal} onChange={(v) => set('goal', v)} options={[{ id: 'lose', label: 'Lose fat' }, { id: 'maintain', label: 'Maintain' }, { id: 'gain', label: 'Build muscle' }]} />
            </div>
            <Field label="Diet">
              <select className={inputCls} value={stats.diet} onChange={(e) => set('diet', e.target.value as Stats['diet'])}>
                <option value="balanced">Balanced</option>
                <option value="high_protein">High protein</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
              </select>
            </Field>
            <Button type="submit" disabled={busy === 'targets'}>
              {busy === 'targets' ? 'Calculating…' : result ? 'Recalculate my needs' : 'Calculate my needs'}
            </Button>
            {error && <p className="text-[13px] text-alert">{error}</p>}
            <p className="text-[11px] text-muted">Saved on this device only. General guidance, not medical advice: if you are pregnant or managing a health condition, check with a doctor or dietitian first.</p>
          </form>
        </Card>

        <Card id="targets" className="flex scroll-mt-20 flex-col gap-5">
          {t && result ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[13px] text-muted">Your daily target</p>
                  <p className="headline text-[56px] font-bold tabular-nums">
                    {t.kcal.toLocaleString()}
                    <span className="ml-1 text-[20px] font-semibold text-muted">kcal</span>
                  </p>
                </div>
                <dl className="flex gap-6 text-[13px]">
                  <div>
                    <dt className="text-muted">BMR</dt>
                    <dd className="text-[17px] font-semibold tabular-nums">{t.bmr.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">TDEE</dt>
                    <dd className="text-[17px] font-semibold tabular-nums">{t.tdee.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
              <SourceLine source={result.source} tool={result.tool} />
              <div className="flex flex-wrap items-center gap-6">
                <Donut
                  protein={t.protein}
                  carbs={t.carbs}
                  fat={t.fat}
                  size={128}
                  center={
                    <div>
                      <div className="text-[13px] font-semibold">Macros</div>
                      <div className="text-[11px] text-muted">per day</div>
                    </div>
                  }
                />
                <div className="min-w-[160px] flex-1">
                  <MacroLegend protein={t.protein} carbs={t.carbs} fat={t.fat} />
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-hair pt-3 text-[13px]">
                    <div>
                      <dt className="flex items-center gap-1 text-muted">
                        <Droplets size={13} /> Water
                      </dt>
                      <dd className="font-semibold tabular-nums">{(t.waterMl / 1000).toFixed(1)} L</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-muted">
                        <Wheat size={13} /> Fibre
                      </dt>
                      <dd className="font-semibold tabular-nums">{t.fibre} g</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-muted">Key nutrients per day</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-4">
                  {t.micros.map((m) => (
                    <div key={m.name}>
                      <dt className="text-muted">{m.name}</dt>
                      <dd className="font-semibold tabular-nums">
                        {m.amount.toLocaleString()} {m.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              {weights.length > 1 && (
                <div className="border-t border-hair pt-4">
                  <p className="flex justify-between text-[13px]">
                    <span className="font-semibold text-muted">Weight trend</span>
                    <span className="tabular-nums">
                      {weights[0].kg} → <span className="font-semibold">{weights[weights.length - 1].kg} kg</span>
                    </span>
                  </p>
                  <Sparkline values={weights.map((w) => w.kg)} color="#0a7d4f" min={Math.min(...weights.map((w) => w.kg)) - 1} max={Math.max(...weights.map((w) => w.kg)) + 1} />
                  <p className="text-[11px] text-muted">Recalculate with your new weight each week to track progress.</p>
                </div>
              )}
            </>
          ) : (
            <div className="grid flex-1 place-items-center py-10 text-center">
              <div className="max-w-xs">
                <Sparkles className="mx-auto mb-3 text-pulse" />
                <p className="text-[17px] font-semibold">Your personalised targets appear here</p>
                <p className="mt-1 text-[14px] text-muted">Fill in your stats and tap Calculate. It takes about two seconds.</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {t && (
        <section className="mt-12">
          <SectionHeader
            eyebrow="Today’s tracker"
            title="How’s today going?"
            sub="Log what you eat and see how close you are to your targets."
            right={
              log.length > 0 && (
                <Button size="sm" variant="secondary" onClick={() => setLogs((l) => ({ ...l, [today()]: [] }))}>
                  Clear today
                </Button>
              )
            }
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Card className="grid content-start gap-4">
              <div className="grid gap-3">
                <Bar label="Calories" value={totals.kcal} goal={t.kcal} unit="kcal" />
                <Bar label="Protein" value={totals.protein} goal={t.protein} unit="g" />
                <Bar label="Carbs" value={totals.carbs} goal={t.carbs} unit="g" />
                <Bar label="Fat" value={totals.fat} goal={t.fat} unit="g" />
                <Bar label="Fibre" value={totals.fibre} goal={t.fibre} unit="g" />
                <Bar label="Sodium (limit)" value={totals.sodium} goal={2000} unit="mg" max />
              </div>

              <form onSubmit={addFood} className="grid gap-2 border-t border-hair pt-4">
                <span className="text-[13px] font-semibold">Add something you ate</span>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <input className={inputCls} value={foodQ} onChange={(e) => setFoodQ(e.target.value)} placeholder="e.g. chicken rice, banana, laksa" aria-label="Food" />
                  </div>
                  <div className="w-20 shrink-0 sm:w-24">
                    <input className={inputCls} type="number" min={1} max={2000} value={grams} onChange={(e) => setGrams(+e.target.value)} aria-label="Grams" />
                  </div>
                  <Button type="submit" disabled={busy === 'food' || !foodQ.trim()} aria-label="Add food">
                    {busy === 'food' ? '…' : <Plus size={18} />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted">Amount in grams. A hawker plate is roughly 300–400 g.</p>
                {foodMsg && <p className="text-[13px]">{foodMsg}</p>}
              </form>

              <div className="grid gap-2">
                <span className="text-[13px] font-semibold">Quick add an ActiveNutri meal</span>
                <div className="flex flex-wrap gap-2">
                  {meals.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addEntry({ name: m.name, grams: 450, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat, fibre: 8, sodium: 650 })}
                      className="flex items-center gap-2 rounded-full border border-hair py-1 pl-1 pr-3 text-[13px] font-medium hover:border-pulse"
                    >
                      <span className="h-7 w-7 overflow-hidden rounded-full">
                        <MealArt meal={m.id} photo={m.photo} alt="" />
                      </span>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {log.length > 0 && (
                <ul className="divide-y divide-hair border-t border-hair">
                  {log.map((e, i) => (
                    <li key={i} className="flex items-center gap-3 py-2 text-[14px]">
                      <span className="flex-1">
                        <span className="font-medium capitalize">{e.name}</span> <span className="text-muted tabular-nums">· {e.grams} g</span>
                      </span>
                      <span className="text-[12px] text-muted tabular-nums">
                        {e.kcal} kcal · {Math.round(e.protein)} g P
                      </span>
                      <button
                        onClick={() => setLogs((l) => ({ ...l, [today()]: log.filter((_, j) => j !== i) }))}
                        aria-label={`Remove ${e.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-alert"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="grid content-start gap-4">
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[17px] font-semibold tracking-tight">Score my day</h3>
                  <Button size="sm" onClick={runScore} disabled={busy === 'score' || log.length === 0}>
                    {busy === 'score' ? 'Scoring…' : score ? 'Re-score' : 'Get my score'}
                  </Button>
                </div>
                {log.length === 0 && <p className="mt-2 text-[13px] text-muted">Log at least one food to get a score.</p>}
                {score && (
                  <div className="anim-rise mt-4">
                    <div className="flex items-end gap-3">
                      <span className="headline text-[56px] font-bold tabular-nums">{score.score}</span>
                      <span className="mb-2 text-[15px] text-muted">/ 100</span>
                      <span className={cx('mb-1 ml-auto grid h-12 w-12 place-items-center rounded-2xl text-[24px] font-bold text-white', score.score >= 70 ? 'bg-pulse' : score.score >= 50 ? 'bg-amber-500' : 'bg-alert')}>
                        {score.grade}
                      </span>
                    </div>
                    <SourceLine source={score.source} tool={score.tool} />
                    {score.priorities.length > 0 && (
                      <ul className="mt-3 grid gap-1.5 text-[14px]">
                        {score.priorities.map((p) => (
                          <li key={p} className="flex gap-2">
                            <span className="text-pulse">→</span> {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>

              <Card>
                <p className="text-[13px] text-muted">
                  <span className="font-semibold text-ink tabular-nums">{left.toLocaleString()} kcal</span> left today
                </p>
                <h3 className="mt-1 text-[17px] font-semibold tracking-tight">Meals that fit what’s left</h3>
                {fits.length ? (
                  <ul className="mt-3 grid gap-2">
                    {fits.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-canvas p-2 pr-3">
                        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                          <MealArt meal={m.id} photo={m.photo} alt="" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold">{m.name}</span>
                          <span className="text-[12px] text-muted tabular-nums">
                            {m.protein} g protein · {m.kcal} kcal · {sgd(m.priceSgd)}
                          </span>
                        </span>
                        <Button size="sm" onClick={() => open({ type: 'reserve', mealId: m.id })}>
                          Order
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[13px] text-muted">You’ve hit today’s calories. Nice work. Water and a light snack only from here.</p>
                )}
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[17px] font-semibold tracking-tight">Plan my day</h3>
                  <Button size="sm" variant="secondary" onClick={runPlan} disabled={busy === 'plan'}>
                    {busy === 'plan' ? 'Planning…' : plan ? 'New plan' : 'Suggest a day'}
                  </Button>
                </div>
                {plan && (
                  <div className="anim-rise mt-3">
                    <SourceLine source={plan.source} tool={plan.tool} />
                    {plan.meals.length ? (
                      <ul className="mt-2 divide-y divide-hair">
                        {plan.meals.map((m) => (
                          <li key={m.slot + m.items} className="py-2 text-[14px]">
                            <p className="flex justify-between gap-3">
                              <span className="font-semibold">{m.slot}</span>
                              {m.kcal > 0 && <span className="text-[12px] text-muted tabular-nums">{m.kcal} kcal · {m.protein} g P</span>}
                            </p>
                            <p className="text-muted">{m.items}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 whitespace-pre-line text-[14px]">{plan.text}</p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
