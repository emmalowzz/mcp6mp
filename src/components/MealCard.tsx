import { MealArt } from './MealArt';
import { Button, cx } from './ui';
import { ATHLETE_PER_MEAL, type Meal } from '../data/catalog';
import { sgd, useStore, VOUCHER_DISCOUNT } from '../lib/store';

export function MealCard({ meal, compact, className }: { meal: Meal; compact?: boolean; className?: string }) {
  const { open, voucher } = useStore();
  const price = voucher ? Math.round(meal.priceSgd * (1 - VOUCHER_DISCOUNT) * 100) / 100 : meal.priceSgd;
  return (
    <article className={cx('group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.06)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,.12)]', className)}>
      <button onClick={() => open({ type: 'meal', mealId: meal.id })} className="relative block aspect-[4/3] overflow-hidden" aria-label={`See details for ${meal.name}`}>
        <div className="h-full w-full transition duration-500 group-hover:scale-[1.04]">
          <MealArt meal={meal.id} photo={meal.photo} alt={meal.name} />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-4 pb-3 pt-10 text-left text-white">
          <p className="text-[13px] font-semibold tabular-nums">
            {meal.protein} g protein · {meal.kcal} kcal
          </p>
        </div>
      </button>
      <div className={cx('flex flex-1 flex-col', compact ? 'p-4' : 'p-5')}>
        <h3 className={cx('headline font-bold', compact ? 'text-[18px]' : 'text-[22px]')}>{meal.name}</h3>
        <p className="mt-1 text-[14px] text-muted">{meal.tagline}</p>
        {!compact && <p className="mt-2 text-[12px] text-muted">Good for: {meal.goodFor}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="tabular-nums">
            <p>
              {voucher && <span className="mr-1.5 text-[13px] text-muted line-through">{sgd(meal.priceSgd)}</span>}
              <span className="text-[20px] font-bold">{sgd(price)}</span>
            </p>
            <button onClick={() => open({ type: 'start', tier: 'athlete' })} className="text-[12px] font-medium text-pulse hover:underline">
              or {sgd(Math.round(ATHLETE_PER_MEAL * 100) / 100)} on Athlete plan
            </button>
          </div>
          <Button size="sm" onClick={() => open({ type: 'reserve', mealId: meal.id })}>
            Order
          </Button>
        </div>
      </div>
    </article>
  );
}
