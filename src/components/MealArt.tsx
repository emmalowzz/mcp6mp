import { useId, useMemo, type ReactNode } from 'react';
import type { MealId } from '../data/catalog';

// Top-down food illustrations, drawn in SVG so the site needs no external image host.
// A real photo can replace any of them: set `photo` on the meal in src/data/catalog.ts.

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Scatter = { n: number; cx: number; cy: number; r: number; seed: number; rInner?: number; arc?: [number, number] };

function points({ n, cx, cy, r, seed, rInner = 0, arc = [0, Math.PI * 2] }: Scatter) {
  const rand = rng(seed);
  return Array.from({ length: n }, () => {
    const a = arc[0] + rand() * (arc[1] - arc[0]);
    const d = rInner + Math.sqrt(rand()) * (r - rInner);
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, rot: rand() * 180, k: rand() };
  });
}

function Grains({ fill, colors, ...s }: Scatter & { fill?: string; colors?: string[] }) {
  const pts = useMemo(() => points(s), [s.n, s.cx, s.cy, s.r, s.seed]);
  return (
    <g>
      {pts.map((p, i) => (
        <ellipse
          key={i}
          cx={p.x}
          cy={p.y}
          rx={3.4}
          ry={1.7}
          transform={`rotate(${p.rot} ${p.x} ${p.y})`}
          fill={colors ? colors[Math.floor(p.k * colors.length)] : fill}
          opacity={0.75 + p.k * 0.25}
        />
      ))}
    </g>
  );
}

function Dots({ colors, size = 2, ...s }: Scatter & { colors: string[]; size?: number }) {
  const pts = useMemo(() => points(s), [s.n, s.cx, s.cy, s.r, s.seed]);
  return (
    <g>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={size * (0.7 + p.k * 0.6)} fill={colors[Math.floor(p.k * colors.length)]} />
      ))}
    </g>
  );
}

function Scene({ bg, bg2, bowl, rim, children, id }: { bg: string; bg2: string; bowl: string; rim: string; children: ReactNode; id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="30%" r="90%">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg2} />
        </radialGradient>
        <radialGradient id={`${id}-bowl`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={rim} />
          <stop offset="1" stopColor={bowl} />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="50%" cy="50%" r="50%">
          <stop offset=".78" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="10" dy="16" stdDeviation="14" floodColor="#000" floodOpacity=".28" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <circle cx="200" cy="150" r="104" />
        </clipPath>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-bg)`} />
      {/* linen napkin */}
      <path d="M300 -10 L420 -10 L420 120 Q360 90 330 40 Z" fill="#fff" opacity=".55" />
      <path d="M318 -10 L326 60 M340 -10 L350 75 M362 -10 L374 88" stroke="#000" strokeOpacity=".05" strokeWidth="2" />
      {/* chopsticks */}
      <g transform="rotate(-62 70 230)">
        <rect x="-20" y="222" width="190" height="6" rx="3" fill="#c9a27a" />
        <rect x="-20" y="236" width="190" height="6" rx="3" fill="#b88d63" />
      </g>
      <circle cx="200" cy="150" r="122" fill={`url(#${id}-bowl)`} filter={`url(#${id}-shadow)`} />
      <circle cx="200" cy="150" r="122" fill="none" stroke="#000" strokeOpacity=".06" strokeWidth="2" />
      <circle cx="200" cy="150" r="106" fill="#000" opacity=".08" />
      <g clipPath={`url(#${id}-clip)`}>{children}</g>
      <circle cx="200" cy="150" r="104" fill={`url(#${id}-shade)`} pointerEvents="none" />
      {/* rim highlight */}
      <path d="M118 92 A104 104 0 0 1 220 46" stroke="#fff" strokeOpacity=".55" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  );
}

function Leaf({ x, y, r, rot, fill, vein = '#ffffff55' }: { x: number; y: number; r: number; rot: number; fill: string; vein?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 0 C ${r * 0.6} ${-r * 0.5}, ${r * 1.6} ${-r * 0.4}, ${r * 2} 0 C ${r * 1.6} ${r * 0.45}, ${r * 0.6} ${r * 0.5}, 0 0 Z`} fill={fill} />
      <path d={`M0 0 L ${r * 1.9} 0`} stroke={vein} strokeWidth="1" />
    </g>
  );
}

function Salmon({ id }: { id: string }) {
  return (
    <Scene id={id} bg="#fde7dc" bg2="#f2c4b0" bowl="#2b2b2e" rim="#4a4a50">
      <circle cx="200" cy="150" r="104" fill="#7a5a3e" />
      <Grains n={420} cx={200} cy={150} r={104} seed={3} colors={['#a77c55', '#8f6644', '#c49a6c', '#b48a5f']} />
      {/* greens */}
      {[...Array(9)].map((_, i) => (
        <Leaf key={i} x={118 + (i % 3) * 14} y={180 + Math.floor(i / 3) * 14} r={14} rot={-40 + i * 25} fill={i % 2 ? '#2f7d32' : '#3f9b45'} />
      ))}
      {/* edamame */}
      <Dots n={34} cx={258} cy={198} r={30} seed={8} colors={['#7cc04f', '#8fd15c', '#6aae3f']} size={6.5} />
      <Dots n={34} cx={258} cy={198} r={30} seed={8} colors={['#ffffff66']} size={2} />
      {/* salmon fillet */}
      <defs>
        <linearGradient id={`${id}-fish`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a6b" />
          <stop offset=".6" stopColor="#f2764a" />
          <stop offset="1" stopColor="#d9562e" />
        </linearGradient>
      </defs>
      <g transform="rotate(-14 205 120)">
        <path d="M130 88 C 150 70, 270 66, 292 92 C 304 108, 296 150, 276 160 C 240 172, 160 170, 136 154 C 116 140, 116 102, 130 88 Z" fill="#000" opacity=".18" transform="translate(5 7)" />
        <path d="M130 88 C 150 70, 270 66, 292 92 C 304 108, 296 150, 276 160 C 240 172, 160 170, 136 154 C 116 140, 116 102, 130 88 Z" fill={`url(#${id}-fish)`} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${152 + i * 24} 80 C ${142 + i * 24} 110, ${160 + i * 24} 140, ${150 + i * 24} 166`} stroke="#ffd9c4" strokeOpacity=".75" strokeWidth="3.5" fill="none" />
        ))}
        <path d="M134 100 C 160 84, 250 80, 288 98" stroke="#b8441f" strokeOpacity=".5" strokeWidth="6" fill="none" strokeLinecap="round" />
        <Dots n={22} cx={215} cy={118} r={42} seed={21} colors={['#fff8e8', '#fff3d6', '#fff8e8', '#5a4636']} size={1.5} />
      </g>
      {/* miso-ginger drizzle & spring onion */}
      <path d="M150 196 C 180 214, 210 190, 240 206" stroke="#f3c26b" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".9" />
      {[...Array(10)].map((_, i) => (
        <circle key={i} cx={185 + (i % 5) * 12} cy={186 + Math.floor(i / 5) * 14 + (i % 2) * 4} r={4} fill="none" stroke="#7fd36b" strokeWidth="2.2" />
      ))}
      {/* lime wedge */}
      <g transform="translate(270 82) rotate(30)">
        <path d="M-22 0 A22 22 0 0 0 22 0 Z" fill="#8ccf3f" />
        <path d="M-17 1 A17 17 0 0 0 17 1 Z" fill="#d6f08a" />
        <path d="M0 1 L0 16 M0 1 L-11 12 M0 1 L11 12" stroke="#8ccf3f" strokeWidth="1.5" />
      </g>
    </Scene>
  );
}

function Chicken({ id }: { id: string }) {
  return (
    <Scene id={id} bg="#fff2d6" bg2="#f5d699" bowl="#f4efe6" rim="#ffffff">
      <circle cx="200" cy="150" r="104" fill="#f7f1e6" />
      {/* sweet potato mash */}
      <defs>
        <radialGradient id={`${id}-mash`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffb25b" />
          <stop offset="1" stopColor="#e9822a" />
        </radialGradient>
        <linearGradient id={`${id}-meat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d99a4e" />
          <stop offset="1" stopColor="#b8702e" />
        </linearGradient>
      </defs>
      <circle cx="148" cy="190" r="50" fill={`url(#${id}-mash)`} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${120 + i * 6} ${175 + i * 10} C ${140 + i * 4} ${160 + i * 8}, ${170} ${180 + i * 6}, ${180 - i * 4} ${200 + i * 4}`} stroke="#ffd29a" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".8" />
      ))}
      {/* broccolini */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${200 + i * 8} ${190 + i * 9}) rotate(${-24 + i * 10})`}>
          <rect x="0" y="-3" width="52" height="6" rx="3" fill="#6fae46" />
          <Dots n={26} cx={56} cy={0} r={12} seed={40 + i} colors={['#2f6b2a', '#3d8a34', '#25541f']} size={3.6} />
        </g>
      ))}
      {/* chicken thigh slices */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${150 + i * 26} ${66 + i * 6}) rotate(${18 + i * 4})`}>
          <rect x="3" y="5" width="30" height="78" rx="10" fill="#000" opacity=".15" />
          <rect x="0" y="0" width="30" height="78" rx="10" fill={`url(#${id}-meat)`} />
          <rect x="4" y="4" width="22" height="70" rx="8" fill="#f1d3a6" opacity=".35" />
          {[14, 34, 54].map((y) => (
            <path key={y} d={`M-2 ${y} L32 ${y + 10}`} stroke="#5a3214" strokeWidth="4" opacity=".55" />
          ))}
        </g>
      ))}
      {/* lemongrass + herbs */}
      <Dots n={40} cx={205} cy={110} r={60} seed={77} colors={['#4f8f2c', '#7cb342']} size={1.8} />
      {/* calamansi halves */}
      {[
        [114, 108],
        [134, 92],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="14" fill="#9fcf3a" />
          <circle cx={x} cy={y} r="11" fill="#f6d64a" />
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <path key={k} d={`M${x} ${y} L${x + Math.cos((k * Math.PI) / 3) * 10} ${y + Math.sin((k * Math.PI) / 3) * 10}`} stroke="#fbe892" strokeWidth="1.4" />
          ))}
        </g>
      ))}
    </Scene>
  );
}

function Tempeh({ id }: { id: string }) {
  return (
    <Scene id={id} bg="#e2f5e6" bg2="#b5e1bf" bowl="#c58f5e" rim="#e4b98c">
      <circle cx="200" cy="150" r="104" fill="#efe2c4" />
      <Dots n={900} cx={200} cy={150} r={104} seed={5} colors={['#f2e3bf', '#e8d3a5', '#b9473a', '#3a2a24', '#f5ead1', '#e2c993']} size={2} />
      {/* kale */}
      {[...Array(8)].map((_, i) => (
        <g key={i} transform={`translate(${112 + (i % 4) * 16} ${118 + Math.floor(i / 4) * 26}) rotate(${-60 + i * 20})`}>
          <path d="M0 0 C 6 -16, 26 -18, 34 -4 C 30 -10, 24 -2, 30 4 C 24 2, 22 12, 28 16 C 16 18, 4 12, 0 0 Z" fill={i % 2 ? '#1f5d33' : '#2b7a43'} />
        </g>
      ))}
      {/* pickled carrot ribbons */}
      {[...Array(9)].map((_, i) => (
        <path key={i} d={`M${200 + i * 5} ${206 - i * 2} q 14 -8 30 2`} stroke={i % 2 ? '#ff8a3d' : '#f26b21'} strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
      {/* glazed tempeh cubes */}
      {[
        [206, 94],
        [236, 104],
        [266, 116],
        [214, 126],
        [246, 138],
        [276, 150],
        [226, 160],
      ].map(([x, y], i) => (
        <g key={i} transform={`rotate(${-12 + i * 6} ${x} ${y})`}>
          <rect x={x - 14} y={y - 12} width="30" height="26" rx="5" fill="#000" opacity=".15" transform="translate(3 4)" />
          <rect x={x - 14} y={y - 12} width="30" height="26" rx="5" fill="#8b5a2b" />
          <rect x={x - 11} y={y - 9} width="24" height="20" rx="4" fill="#a8743e" />
          <Dots n={8} cx={x + 1} cy={y + 1} r={9} seed={100 + i} colors={['#e9cf9d', '#d8b47a']} size={1.8} />
          <path d={`M${x - 10} ${y - 8} L${x + 12} ${y - 8}`} stroke="#4a2a10" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      {/* peanut-lime dressing + peanuts */}
      <path d="M150 176 C 190 150, 240 200, 290 176" stroke="#d99a4a" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".85" />
      <Dots n={18} cx={170} cy={200} r={24} seed={61} colors={['#c98a4b', '#b4733a']} size={3.4} />
      {/* red chilli + coriander */}
      {[...Array(6)].map((_, i) => (
        <circle key={i} cx={250 + (i % 3) * 10} cy={86 + Math.floor(i / 3) * 10} r="3.6" fill="none" stroke="#e53935" strokeWidth="2" />
      ))}
      {[...Array(5)].map((_, i) => (
        <Leaf key={i} x={150 + i * 9} y={96 + (i % 2) * 8} r={6} rot={i * 60} fill="#4caf50" />
      ))}
    </Scene>
  );
}

function Congee({ id }: { id: string }) {
  return (
    <Scene id={id} bg="#eee8ff" bg2="#cfc2f5" bowl="#1f3a5f" rim="#3b5f8f">
      <defs>
        <radialGradient id={`${id}-porridge`} cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#efe5cf" />
        </radialGradient>
        <radialGradient id={`${id}-yolk`} cx="40%" cy="40%" r="60%">
          <stop offset="0" stopColor="#ffb300" />
          <stop offset="1" stopColor="#f57c00" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="150" r="104" fill={`url(#${id}-porridge)`} />
      <Grains n={160} cx={200} cy={150} r={100} seed={13} fill="#e6dcc4" />
      {/* sesame oil glints */}
      {[...Array(9)].map((_, i) => (
        <ellipse key={i} cx={130 + ((i * 37) % 140)} cy={110 + ((i * 53) % 90)} rx={6 + (i % 3) * 3} ry={3 + (i % 2) * 2} fill="#e8b84a" opacity=".35" />
      ))}
      {/* shredded chicken */}
      {[...Array(14)].map((_, i) => (
        <path key={i} d={`M${170 + (i % 5) * 12} ${126 + Math.floor(i / 5) * 14} q 10 ${i % 2 ? -6 : 6} 22 2`} stroke={i % 3 ? '#e9d2b0' : '#d9b98d'} strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
      {/* soft egg halves */}
      {[
        [252, 104, 20],
        [266, 160, -15],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x + 2} cy={y + 4} rx="24" ry="19" fill="#000" opacity=".12" />
          <ellipse cx={x} cy={y} rx="24" ry="19" fill="#fffef8" />
          <circle cx={x} cy={y} r="11" fill={`url(#${id}-yolk)`} />
          <circle cx={x - 3} cy={y - 3} r="3" fill="#fff" opacity=".5" />
        </g>
      ))}
      {/* ginger julienne */}
      {[...Array(12)].map((_, i) => (
        <rect key={i} x={140 + (i % 4) * 9} y={172 + Math.floor(i / 4) * 9} width="16" height="2.6" rx="1.3" fill="#f6d365" transform={`rotate(${-30 + i * 17} ${148 + (i % 4) * 9} ${173 + Math.floor(i / 4) * 9})`} />
      ))}
      {/* spring onion rings */}
      {[...Array(16)].map((_, i) => (
        <circle key={i} cx={150 + ((i * 29) % 110)} cy={96 + ((i * 41) % 110)} r={4.2} fill="none" stroke={i % 2 ? '#5cbf4a' : '#8fd67a'} strokeWidth="2.4" />
      ))}
      {/* fried shallots + white pepper */}
      <Dots n={20} cx={200} cy={150} r={70} seed={29} colors={['#b5651d', '#8d4a12', '#c98a3c']} size={2.2} />
      {/* steam */}
      <g stroke="#fff" strokeOpacity=".7" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M176 70 C 166 54, 186 44, 176 26" />
        <path d="M206 66 C 196 50, 216 40, 206 20" />
        <path d="M236 72 C 226 56, 246 46, 236 30" />
      </g>
    </Scene>
  );
}

const ART: Record<MealId, (p: { id: string }) => ReactNode> = {
  'sous-vide-salmon': Salmon,
  'citrus-herb-chicken': Chicken,
  'tempeh-quinoa': Tempeh,
  'bone-broth-congee': Congee,
};

export function MealArt({ meal, photo, className, alt }: { meal: MealId; photo?: string; className?: string; alt: string }) {
  const id = useId().replace(/:/g, '');
  if (photo) return <img src={photo} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className ?? ''}`} />;
  const Art = ART[meal];
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className ?? ''}`} role="img" aria-label={alt}>
      <Art id={id} />
    </svg>
  );
}
