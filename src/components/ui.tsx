import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.04)] sm:p-6', className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="headline text-[28px] font-bold sm:text-[34px]">{title}</h2>
        {sub && <p className="mt-2 max-w-2xl text-[15px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' };

export function Button({ variant = 'primary', size = 'md', className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition active:scale-[.98] disabled:opacity-40',
        size === 'sm' ? 'h-8 px-3.5 text-[13px]' : 'h-11 px-5 text-[15px]',
        variant === 'primary' && 'bg-ink text-white hover:bg-black',
        variant === 'secondary' && 'bg-black/[.05] text-ink hover:bg-black/[.08]',
        variant === 'ghost' && 'text-link hover:underline',
        variant === 'danger' && 'bg-alert text-white hover:brightness-110',
        className,
      )}
    />
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl bg-black/[.05] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition',
            value === o.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatusDot({ state }: { state: 'ok' | 'warn' | 'down' | 'idle' }) {
  const color = { ok: 'bg-emerald-500', warn: 'bg-amber-500', down: 'bg-red-500', idle: 'bg-zinc-400' }[state];
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {state === 'ok' && <span className={cx('anim-ping absolute inset-0 rounded-full', color)} />}
      <span className={cx('relative inline-flex h-2.5 w-2.5 rounded-full', color)} />
    </span>
  );
}

// Static metadata: plain text, no pill.
export function Meta({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cx(
          'sheet max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none sm:rounded-3xl sm:p-7',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="headline text-[22px] font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[.05] hover:bg-black/10">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="anim-fade fixed inset-0 z-40 flex items-end bg-black/30 md:items-stretch md:justify-end" onClick={onClose}>
      <aside
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="sheet sheet-side max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:max-h-none md:max-w-md md:rounded-none md:rounded-l-3xl md:p-7"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="headline text-[22px] font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[.05] hover:bg-black/10">
            <X size={16} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function Donut({
  protein,
  carbs,
  fat,
  size = 120,
  center,
}: {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
  center?: ReactNode;
}) {
  const kcal = [protein * 4, carbs * 4, fat * 9];
  const total = kcal.reduce((a, b) => a + b, 0) || 1;
  const colors = ['#0a7d4f', '#f5b83d', '#f97362'];
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size} role="img" aria-label={`Protein ${protein} g, carbs ${carbs} g, fat ${fat} g`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f0f0f2" strokeWidth="12" />
        {kcal.map((v, i) => {
          const len = (v / total) * c;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={colors[i]}
              strokeWidth="12"
              strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
              strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray .6s ease, stroke-dashoffset .6s ease' }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
    </div>
  );
}

export function MacroLegend({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const rows: [string, number, string][] = [
    ['Protein', protein, '#0a7d4f'],
    ['Carbs', carbs, '#f5b83d'],
    ['Fat', fat, '#f97362'],
  ];
  return (
    <dl className="grid gap-1.5 text-[13px]">
      {rows.map(([k, v, c]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: c }} />
          <dt className="text-muted">{k}</dt>
          <dd className="ml-auto font-semibold tabular-nums">{v} g</dd>
        </div>
      ))}
    </dl>
  );
}

export function Sparkline({ values, color, min, max }: { values: number[]; color: string; min: number; max: number }) {
  const pts = values
    .map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${30 - ((v - min) / (max - min)) * 30}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'h-11 w-full rounded-xl border border-hair bg-white px-3.5 text-[15px] outline-none transition focus:border-link focus:ring-4 focus:ring-link/15';
