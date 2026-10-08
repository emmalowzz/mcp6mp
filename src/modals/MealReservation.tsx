import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Donut, Field, MacroLegend, Modal, inputCls } from '../components/ui';
import { passcode as makePasscode, sgd, useStore, VOUCHER_DISCOUNT, type Reservation } from '../lib/store';
import { mealById, pods, type MealId } from '../data/catalog';

function pickupWindows() {
  const out: string[] = [];
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  d.setHours(d.getHours() + 1);
  for (let i = 0; i < 6; i++) {
    out.push(d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false }));
    d.setMinutes(d.getMinutes() + 30);
  }
  return out;
}

export function MealReservation({ mealId, podId }: { mealId: MealId; podId?: string }) {
  const { close, open, voucher, addReservation } = useStore();
  const meal = mealById(mealId);
  const windows = pickupWindows();
  const available = pods.filter((p) => p.status === 'online');
  const [pod, setPod] = useState(podId && available.some((p) => p.id === podId) ? podId : available[0].id);
  const [time, setTime] = useState(windows[0]);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState<Reservation | null>(null);

  const unit = voucher ? meal.priceSgd * (1 - VOUCHER_DISCOUNT) : meal.priceSgd;
  // Voucher applies to the first meal only.
  const total = Math.round((unit + meal.priceSgd * (qty - 1)) * 100) / 100;

  function confirm() {
    const r: Reservation = { mealId, podId: pod, passcode: makePasscode(), priceSgd: total, createdAt: Date.now() };
    addReservation(r);
    setDone(r);
  }

  const podInfo = pods.find((p) => p.id === pod)!;

  return (
    <Modal title={done ? 'Meal reserved' : 'Reserve a meal'} onClose={close}>
      {done ? (
        <div className="anim-rise text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pulse-soft text-pulse">
            <Check />
          </span>
          <p className="mt-3 text-[15px]">
            {qty} × {meal.name} at {podInfo.name}, from {time}
          </p>
          <p className="mt-5 text-[12px] text-muted">Pickup passcode</p>
          <p className="headline text-[48px] font-bold tracking-[0.15em] tabular-nums">{done.passcode}</p>
          <p className="text-[12px] text-muted">
            {podInfo.id} · held in {meal.zone} · paid {sgd(done.priceSgd)} (demo, no charge)
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={close}>
              Done
            </Button>
            <Button onClick={() => open({ type: 'nfc', podId: done.podId, passcode: done.passcode })}>I’m at the pod — unlatch</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center gap-4 rounded-2xl bg-canvas p-4">
            <Donut protein={meal.protein} carbs={meal.carbs} fat={meal.fat} size={80} center={<span className="text-[13px] font-bold tabular-nums">{meal.kcal}</span>} />
            <div className="flex-1">
              <p className="text-[16px] font-semibold">{meal.name}</p>
              <p className="mb-2 text-[12px] text-muted">{meal.kitchen}</p>
              <MacroLegend protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
            </div>
          </div>
          <Field label="Pickup pod">
            <select className={inputCls} value={pod} onChange={(e) => setPod(e.target.value)}>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.name} ({p.stock} in stock)
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ready from">
              <select className={inputCls} value={time} onChange={(e) => setTime(e.target.value)}>
                {windows.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <div className="flex h-11 items-center justify-between rounded-xl border border-hair px-1">
                <button className="h-9 w-9 rounded-lg text-[18px] hover:bg-black/5 disabled:opacity-30" onClick={() => setQty((q) => q - 1)} disabled={qty <= 1} aria-label="Decrease">
                  −
                </button>
                <span className="font-semibold tabular-nums">{qty}</span>
                <button className="h-9 w-9 rounded-lg text-[18px] hover:bg-black/5 disabled:opacity-30" onClick={() => setQty((q) => q + 1)} disabled={qty >= 4} aria-label="Increase">
                  +
                </button>
              </div>
            </Field>
          </div>
          <div className="flex items-center justify-between border-t border-hair pt-4">
            <div>
              <p className="text-[12px] text-muted">{voucher ? `${voucher} · ${VOUCHER_DISCOUNT * 100}% off first meal` : 'Total'}</p>
              <p className="text-[24px] font-bold tabular-nums">{sgd(total)}</p>
            </div>
            <Button onClick={confirm}>Confirm reservation</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
