import { useMemo, useState } from 'react';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import { project } from '../data/catalog';
import { cx } from './ui';

// Simplified Singapore coastline (lat, lng) — stylised, not survey-grade.
const COAST: [number, number][] = [
  [1.300, 103.618], [1.322, 103.632], [1.352, 103.645], [1.385, 103.672], [1.418, 103.695], [1.438, 103.722],
  [1.447, 103.758], [1.452, 103.785], [1.461, 103.806], [1.462, 103.832], [1.452, 103.857], [1.437, 103.874],
  [1.420, 103.892], [1.414, 103.912], [1.397, 103.935], [1.388, 103.962], [1.378, 103.986], [1.364, 104.021],
  [1.335, 104.031], [1.318, 104.000], [1.307, 103.963], [1.300, 103.927], [1.293, 103.893], [1.275, 103.866],
  [1.262, 103.845], [1.262, 103.825], [1.274, 103.800], [1.286, 103.776], [1.296, 103.752], [1.290, 103.730],
  [1.272, 103.712], [1.262, 103.688], [1.278, 103.660], [1.290, 103.636],
];
const SENTOSA: [number, number][] = [
  [1.257, 103.808], [1.255, 103.828], [1.247, 103.840], [1.240, 103.830], [1.243, 103.812],
];
const TEKONG: [number, number][] = [
  [1.425, 104.030], [1.420, 104.060], [1.395, 104.075], [1.385, 104.055], [1.398, 104.033],
];

const toPath = (pts: [number, number][]) =>
  pts.map(([la, ln], i) => {
    const { x, y } = project(la, ln);
    return `${i ? 'L' : 'M'}${x.toFixed(2)},${(y * 0.58).toFixed(2)}`;
  }).join(' ') + 'Z';

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  tone?: 'pulse' | 'muted' | 'warn' | 'user';
};

export function MapCanvas({
  pins,
  selected,
  onSelect,
  className,
  showLabels = true,
  focus,
}: {
  pins: Pin[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  showLabels?: boolean;
  focus?: { lat: number; lng: number } | null;
}) {
  const [zoom, setZoom] = useState(1);
  const W = 100;
  const H = 58;

  const center = useMemo(() => {
    const f = focus ?? (selected ? pins.find((p) => p.id === selected) : null);
    if (!f) return { x: 50, y: H / 2 };
    const { x, y } = project(f.lat, f.lng);
    return { x, y: y * 0.58 };
  }, [focus, selected, pins]);

  const vw = W / zoom;
  const vh = H / zoom;
  const vx = Math.min(Math.max(center.x - vw / 2, 0), W - vw);
  const vy = Math.min(Math.max(center.y - vh / 2, 0), H - vh);
  const s = 1 / zoom;

  return (
    <div className={cx('relative overflow-hidden rounded-2xl bg-[#dbe9f4]', className)}>
      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} className="block h-full w-full" style={{ transition: 'all .4s ease' }} role="img" aria-label="Map of Singapore with venue pins">
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M5 0H0V5" fill="none" stroke="#c9dcea" strokeWidth=".15" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />
        <path d={toPath(COAST)} fill="#f4f1ea" stroke="#c8c2b4" strokeWidth={0.25 * s} />
        <path d={toPath(SENTOSA)} fill="#f4f1ea" stroke="#c8c2b4" strokeWidth={0.25 * s} />
        <path d={toPath(TEKONG)} fill="#f4f1ea" stroke="#c8c2b4" strokeWidth={0.25 * s} />
        {/* Central catchment and expressways — orientation cues */}
        <ellipse cx="46" cy={(project(1.36, 103.81).y * 0.58).toFixed(2)} rx="6" ry="3.2" fill="#d6ead2" />
        <path d="M14 32 C30 30, 50 33, 72 28 S92 24, 96 22" stroke="#f2c57c" strokeWidth={0.5 * s} fill="none" />
        <path d="M46 8 C47 18, 50 30, 56 44" stroke="#f2c57c" strokeWidth={0.5 * s} fill="none" />

        {pins.map((p) => {
          const { x, y: yy } = project(p.lat, p.lng);
          const y = yy * 0.58;
          const active = p.id === selected;
          const fill = p.tone === 'muted' ? '#a1a1aa' : p.tone === 'warn' ? '#f59e0b' : p.tone === 'user' ? '#0066cc' : '#0a7d4f';
          const r = (active ? 1.6 : showLabels ? 1.2 : 0.8) * s;
          return (
            <g
              key={p.id}
              onClick={() => onSelect?.(p.id)}
              className={onSelect ? 'cursor-pointer' : undefined}
              role={onSelect ? 'button' : undefined}
              aria-label={p.label}
              tabIndex={onSelect ? 0 : undefined}
              onKeyDown={(e) => e.key === 'Enter' && onSelect?.(p.id)}
            >
              {active && <circle cx={x} cy={y} r={r * 2.4} fill={fill} opacity=".18" />}
              <circle cx={x} cy={y} r={r} fill={fill} stroke="#fff" strokeWidth={0.35 * s} />
              {showLabels && p.label && (
                <text x={x + r + 0.8 * s} y={y + 0.9 * s} fontSize={2.6 * s} fontWeight={active ? 700 : 600} fill="#1d1d1f" style={{ paintOrder: 'stroke', stroke: '#f4f1ea', strokeWidth: 0.6 * s }}>
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-xl bg-white/90 shadow-sm backdrop-blur">
        <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 0.5))} className="grid h-8 w-8 place-items-center hover:bg-black/5">
          <Plus size={15} />
        </button>
        <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="grid h-8 w-8 place-items-center border-t border-hair hover:bg-black/5">
          <Minus size={15} />
        </button>
        <button aria-label="Reset view" onClick={() => setZoom(1)} className="grid h-8 w-8 place-items-center border-t border-hair hover:bg-black/5">
          <LocateFixed size={15} />
        </button>
      </div>
      <p className="absolute bottom-1.5 left-2 text-[10px] text-muted">Stylised OneMap SG base · venue coordinates WGS84</p>
    </div>
  );
}
