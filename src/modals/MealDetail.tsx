import { Check, Leaf, Stethoscope } from 'lucide-react';
import { MealArt } from '../components/MealArt';
import { Button, Donut, MacroLegend, Modal } from '../components/ui';
import { ATHLETE_PER_MEAL, mealById, type MealId } from '../data/catalog';
import { sgd, useStore, VOUCHER_DISCOUNT } from '../lib/store';

export function MealDetail({ mealId }: { mealId: MealId }) {
  const { close, open, voucher } = useStore();
  const m = mealById(mealId);
  const price = voucher ? Math.round(m.priceSgd * (1 - VOUCHER_DISCOUNT) * 100) / 100 : m.priceSgd;
  return (
    <Modal title={m.name} onClose={close} wide>
      <div className="-mx-5 -mt-2 mb-5 aspect-[16/9] overflow-hidden sm:-mx-7">
        <MealArt meal={m.id} photo={m.photo} alt={m.name} />
      </div>
      <p className="text-[17px] font-semibold">{m.tagline}</p>
      <p className="mt-1 text-[15px] text-muted">{m.blurb}</p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl bg-canvas p-4">
          <Donut
            protein={m.protein}
            carbs={m.carbs}
            fat={m.fat}
            size={96}
            center={
              <div>
                <div className="text-[17px] font-bold tabular-nums">{m.kcal}</div>
                <div className="text-[10px] text-muted">kcal</div>
              </div>
            }
          />
          <div className="flex-1">
            <MacroLegend protein={m.protein} carbs={m.carbs} fat={m.fat} />
          </div>
        </div>
        <div className="rounded-2xl bg-pulse-soft p-4 text-[14px]">
          <p className="flex items-center gap-1.5 font-semibold text-pulse">
            <Stethoscope size={16} /> Nutritionist’s note
          </p>
          <p className="mt-1">{m.note}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <h4 className="text-[13px] font-semibold text-muted">What’s inside</h4>
          <ul className="mt-2 grid gap-1.5 text-[14px]">
            {m.ingredients.map((i) => (
              <li key={i} className="flex gap-2">
                <Leaf size={15} className="mt-0.5 shrink-0 text-pulse" /> {i}
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid content-start gap-3 text-[14px]">
          <div>
            <dt className="text-[13px] font-semibold text-muted">Good for</dt>
            <dd>{m.goodFor}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-semibold text-muted">Allergens</dt>
            <dd>{m.allergens}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-semibold text-muted">Made by</dt>
            <dd>
              {m.kitchen} · SFA Grade-A · held in {m.zone}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-3 border-t border-hair pt-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-hair p-4">
          <p className="text-[13px] text-muted">Just this meal</p>
          <p className="text-[24px] font-bold tabular-nums">
            {voucher && <span className="mr-2 text-[15px] font-normal text-muted line-through">{sgd(m.priceSgd)}</span>}
            {sgd(price)}
          </p>
          <Button className="mt-3 w-full" variant="secondary" onClick={() => open({ type: 'reserve', mealId: m.id })}>
            Order once
          </Button>
        </div>
        <div className="rounded-2xl border-2 border-pulse p-4">
          <p className="text-[13px] font-semibold text-pulse">Best value · Athlete plan</p>
          <p className="text-[24px] font-bold tabular-nums">
            {sgd(Math.round(ATHLETE_PER_MEAL * 100) / 100)}
            <span className="text-[13px] font-normal text-muted"> / meal</span>
          </p>
          <p className="flex items-center gap-1 text-[12px] text-muted">
            <Check size={13} className="text-pulse" /> 20 meals for S$89 a month · cancel anytime
          </p>
          <Button className="mt-3 w-full" onClick={() => open({ type: 'start', tier: 'athlete' })}>
            Start Athlete plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
