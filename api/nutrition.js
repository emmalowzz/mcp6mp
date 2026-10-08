// /api/nutrition — personalised daily nutrition, powered by the NutriBalance MCP server.
//
// The browser POSTs { action, ... } here. This route talks to NutriBalance over MCP
// (Streamable HTTP), discovers its tools at runtime, maps our inputs onto each tool's
// published input schema, and normalises the answer. If NutriBalance is unreachable or a
// call fails, it answers from the built-in estimate engine below and says so via `source`.
//
// Actions: targets | food | score | plan

export const NUTRIBALANCE_URL = process.env.NUTRIBALANCE_MCP_URL || 'https://server.smithery.ai/NutriBalance/nutribalance-mcp';
const TIMEOUT_MS = 4000;
const TOOL_CACHE_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------- MCP client

function headers(sessionId) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (sessionId) h['Mcp-Session-Id'] = sessionId;
  if (process.env.SMITHERY_API_KEY) h.Authorization = `Bearer ${process.env.SMITHERY_API_KEY}`;
  return h;
}

async function readRpc(res) {
  const text = await res.text();
  const type = res.headers.get('content-type') || '';
  try {
    if (type.includes('text/event-stream')) {
      const lines = text.split('\n').filter((l) => l.startsWith('data:'));
      for (const l of lines) {
        const msg = JSON.parse(l.slice(5).trim());
        if (msg.result || msg.error) return msg;
      }
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function post(body, sessionId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(NUTRIBALANCE_URL, { method: 'POST', headers: headers(sessionId), body: JSON.stringify(body), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let rpcId = 0;
async function session() {
  const init = await post({
    jsonrpc: '2.0',
    id: ++rpcId,
    method: 'initialize',
    params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'activenutri', version: '1.4.0' } },
  });
  if (!init.ok) throw new Error(`NutriBalance answered HTTP ${init.status}`);
  const payload = await readRpc(init);
  if (payload?.error) throw new Error(payload.error.message);
  const sessionId = init.headers.get('mcp-session-id') || undefined;
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId).then((r) => r.body?.cancel?.()).catch(() => undefined);
  return sessionId;
}

async function rpc(method, params, sessionId) {
  const res = await post({ jsonrpc: '2.0', id: ++rpcId, method, params }, sessionId);
  if (!res.ok) throw new Error(`NutriBalance answered HTTP ${res.status}`);
  const msg = await readRpc(res);
  if (!msg) throw new Error('Unreadable response from NutriBalance');
  if (msg.error) throw new Error(msg.error.message);
  return msg.result;
}

let toolCache = { at: 0, tools: null, sessionId: undefined };
async function tools() {
  if (toolCache.tools && Date.now() - toolCache.at < TOOL_CACHE_MS) return toolCache;
  const sessionId = await session();
  const result = await rpc('tools/list', {}, sessionId);
  toolCache = { at: Date.now(), tools: result.tools || [], sessionId };
  return toolCache;
}

async function callTool(name, args) {
  let { sessionId } = await tools();
  try {
    return await rpc('tools/call', { name, arguments: args }, sessionId);
  } catch (err) {
    // Session may have expired: open a fresh one once.
    toolCache.at = 0;
    ({ sessionId } = await tools());
    return rpc('tools/call', { name, arguments: args }, sessionId);
  }
}

// ---------------------------------------------------------------- schema mapping

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// Which tool does each action want? Matched against the tool's name and description.
const TOOL_PATTERNS = {
  targets: [/tdee|bmr|macro.*target|daily.*(target|need|requirement)|calorie.*need/],
  food: [/food|lookup|nutrition.*(profile|info|facts)|nutrient.*profile/],
  plan: [/meal.?plan|plan.*meal|day.*meal/],
  score: [/score|grade|rate.*(day|diet|intake)|evaluate/],
};
const TOOL_EXCLUDE = { food: /plan|score|deficien|tdee|bmr/, targets: /plan|score|deficien|food/ };

function pickTool(list, action) {
  const scored = list
    .map((t) => {
      const hay = `${t.name} ${t.description || ''}`.toLowerCase();
      if (TOOL_EXCLUDE[action]?.test(t.name.toLowerCase())) return null;
      const hit = TOOL_PATTERNS[action].some((re) => re.test(hay));
      const nameHit = TOOL_PATTERNS[action].some((re) => re.test(t.name.toLowerCase()));
      return hit ? { t, rank: nameHit ? 2 : 1 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.rank - a.rank);
  return scored[0]?.t || null;
}

function pickEnum(options, wanted) {
  const w = norm(wanted);
  let best = options[0];
  let bestScore = -1;
  for (const o of options) {
    const n = norm(o);
    let s = 0;
    if (n === w) s = 100;
    else if (n.includes(w) || w.includes(n)) s = 50 + Math.min(n.length, w.length);
    else for (let i = 3; i <= Math.min(n.length, w.length); i++) if (n.includes(w.slice(0, i))) s = i;
    if (s > bestScore) [best, bestScore] = [o, s];
  }
  return best;
}

const ACTIVITY_WORDS = { sedentary: 'sedentary', light: 'light', moderate: 'moderate', active: 'active', very_active: 'very active' };
const GOAL_WORDS = { lose: 'lose weight', maintain: 'maintain', gain: 'gain muscle' };

// Our canonical values, keyed by a test on the tool's property name.
function valueFor(key, prop, ctx) {
  const k = norm(key);
  const s = ctx.stats || {};
  const unit = (prop.description || '').toLowerCase() + k;
  const pick = (v) => (prop.enum ? pickEnum(prop.enum, v) : v);
  if (/calorie|kcal|energy/.test(k)) return ctx.targets?.kcal;
  if (/(^|user|your)age(years|yrs)?$/.test(k)) return s.age;
  if (/sex|gender/.test(k)) return pick(s.sex);
  if (/weight/.test(k)) return /lb|pound/.test(unit) ? Math.round(s.weightKg * 2.2046) : s.weightKg;
  if (/height/.test(k)) return /inch|\bin\b|ft|feet/.test(unit) ? Math.round(s.heightCm / 2.54) : /\bm\b|metre|meter/.test(unit) && !/cm/.test(unit) ? s.heightCm / 100 : s.heightCm;
  if (/activity/.test(k)) return pick(ACTIVITY_WORDS[s.activity] || s.activity);
  if (/goal|objective/.test(k)) return pick(GOAL_WORDS[s.goal] || s.goal);
  if (/diet/.test(k)) return pick(s.diet === 'balanced' ? 'balanced' : s.diet.replace('_', ' '));
  if (/protein/.test(k)) return ctx.targets?.protein;
  if (/food|query|item|name|ingredient/.test(k) && ctx.query) return ctx.query;
  if (/gram|amount|serving|quantity|portion|size/.test(k) && ctx.grams) return prop.type === 'string' ? `${ctx.grams}g` : ctx.grams;
  if (/meals|foods|items|log|intake|entries|eaten/.test(k) && ctx.log) {
    return prop.type === 'string'
      ? ctx.log.map((e) => `${e.grams}g ${e.name}`).join(', ')
      : ctx.log.map((e) => ({ name: e.name, grams: e.grams, calories: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat, fiber: e.fibre, sodium: e.sodium }));
  }
  if (/sport|exercise|training/.test(k)) return prop.type === 'number' || prop.type === 'integer' ? s.trainingMin : s.sport;
  return undefined;
}

function buildArgs(tool, ctx) {
  const props = tool.inputSchema?.properties || {};
  const required = tool.inputSchema?.required || [];
  const args = {};
  for (const [key, prop] of Object.entries(props)) {
    let v = valueFor(key, prop, ctx);
    if (v === undefined || v === null || v === '') continue;
    if ((prop.type === 'number' || prop.type === 'integer') && typeof v === 'string' && !Number.isNaN(Number(v))) v = Number(v);
    if (prop.type === 'integer' && typeof v === 'number') v = Math.round(v);
    args[key] = v;
  }
  const missing = required.filter((r) => !(r in args));
  if (missing.length) throw new Error(`Cannot fill NutriBalance inputs: ${missing.join(', ')}`);
  return args;
}

function parseResult(result) {
  if (result?.isError) throw new Error(result.content?.[0]?.text || 'NutriBalance tool error');
  if (result?.structuredContent) return { data: result.structuredContent, text: null };
  const text = (result?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  try {
    return { data: JSON.parse(text), text: null };
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return { data: JSON.parse(m[0]), text };
      } catch {
        /* fall through */
      }
    }
    return { data: null, text };
  }
}

// Find the first number under a key matching `re`, anywhere in a nested object; falls back to "label: 123" in text.
function findNum(obj, re, text) {
  const seen = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return undefined;
    seen.add(o);
    for (const [k, v] of Object.entries(o)) {
      if (re.test(k.toLowerCase())) {
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && /^-?\d+(\.\d+)?/.test(v)) return parseFloat(v);
        if (v && typeof v === 'object') {
          const inner = v.grams ?? v.g ?? v.value ?? v.amount ?? v.target;
          if (typeof inner === 'number') return inner;
        }
      }
    }
    for (const v of Object.values(o)) {
      const r = walk(v);
      if (r !== undefined) return r;
    }
    return undefined;
  };
  const r = walk(obj);
  if (r !== undefined) return r;
  if (text) {
    const m = text.match(new RegExp(`(${re.source})[^0-9\\n]{0,24}(\\d+(?:\\.\\d+)?)`, 'i'));
    if (m) return parseFloat(m[m.length - 1]);
  }
  return undefined;
}

const snippet = (t) => (t ? t.replace(/\s+/g, ' ').trim().slice(0, 600) : null);

// ---------------------------------------------------------------- estimate engine (fallback)

const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };

export function estimateTargets(s) {
  const bmr = 10 * s.weightKg + 6.25 * s.heightCm - 5 * s.age + (s.sex === 'female' ? -161 : 5);
  const tdee = bmr * (ACTIVITY[s.activity] || 1.55) + (s.trainingMin || 0) * 4; // ~4 kcal/min extra for logged training
  const adj = s.goal === 'lose' ? -Math.min(500, tdee * 0.15) : s.goal === 'gain' ? tdee * 0.1 : 0;
  const kcal = tdee + adj;
  const perKg = { sedentary: 1.2, light: 1.4, moderate: 1.6, active: 1.8, very_active: 2.0 }[s.activity] + (s.goal === 'lose' || s.goal === 'gain' ? 0.2 : 0) + (s.diet === 'high_protein' ? 0.2 : 0);
  const protein = s.weightKg * perKg;
  const fatShare = s.diet === 'keto' ? 0.7 : 0.27;
  const fat = (kcal * fatShare) / 9;
  const carbs = s.diet === 'keto' ? (kcal * 0.05) / 4 : Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  const female = s.sex === 'female';
  const older = s.age > 50;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fibre: Math.round((kcal / 1000) * 14),
    waterMl: Math.round((s.weightKg * 35 + (s.trainingMin || 0) * 12) / 50) * 50,
    micros: [
      { name: 'Iron', amount: female && !older ? 18 : 8, unit: 'mg' },
      { name: 'Calcium', amount: (female && older) || s.age > 70 ? 1200 : 1000, unit: 'mg' },
      { name: 'Vitamin D', amount: s.age > 70 ? 20 : 15, unit: 'µg' },
      { name: 'Vitamin C', amount: female ? 75 : 90, unit: 'mg' },
      { name: 'Magnesium', amount: female ? (s.age > 30 ? 320 : 310) : s.age > 30 ? 420 : 400, unit: 'mg' },
      { name: 'Potassium', amount: female ? 2600 : 3400, unit: 'mg' },
      { name: 'Zinc', amount: female ? 8 : 11, unit: 'mg' },
      { name: 'Sodium (max)', amount: 2000, unit: 'mg' },
    ],
  };
}

// Per 100 g. Common Singapore foods plus the ActiveNutri menu (per serving, flagged).
const FOODS = [
  ['chicken rice', 163, 7.5, 21, 5.5, 0.6, 330],
  ['nasi lemak', 185, 5, 22, 8.5, 1.2, 280],
  ['char kway teow', 190, 6, 24, 8, 1.1, 480],
  ['laksa', 110, 4.5, 11, 5.5, 0.8, 380],
  ['yong tau foo soup', 60, 5, 5, 2, 0.8, 300],
  ['fish soup', 45, 5.5, 3, 1.2, 0.5, 290],
  ['kaya toast', 330, 7, 45, 13, 1.5, 380],
  ['white rice', 130, 2.7, 28, 0.3, 0.4, 1],
  ['brown rice', 112, 2.3, 24, 0.8, 1.8, 5],
  ['chicken breast', 165, 31, 0, 3.6, 0, 74],
  ['salmon', 208, 20, 0, 13, 0, 59],
  ['egg', 155, 13, 1.1, 11, 0, 124],
  ['tofu', 76, 8, 1.9, 4.8, 0.3, 7],
  ['oats', 389, 17, 66, 7, 10.6, 2],
  ['banana', 89, 1.1, 23, 0.3, 2.6, 1],
  ['apple', 52, 0.3, 14, 0.2, 2.4, 1],
  ['greek yogurt', 97, 9, 3.6, 5, 0, 36],
  ['milo', 64, 2.5, 10, 1.6, 0.4, 45],
  ['broccoli', 34, 2.8, 7, 0.4, 2.6, 33],
  ['sweet potato', 86, 1.6, 20, 0.1, 3, 55],
];

export function estimateFood(query, grams) {
  const q = norm(query);
  const row = FOODS.find(([n]) => norm(n) === q) || FOODS.find(([n]) => norm(n).includes(q) || q.includes(norm(n)));
  if (!row) return null;
  const f = grams / 100;
  const [name, kcal, protein, carbs, fat, fibre, sodium] = row;
  const r1 = (n) => Math.round(n * f * 10) / 10;
  return { name, grams, kcal: Math.round(kcal * f), protein: r1(protein), carbs: r1(carbs), fat: r1(fat), fibre: r1(fibre), sodium: Math.round(sodium * f) };
}

export function estimateScore(targets, log) {
  const t = log.reduce((a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat, fibre: a.fibre + (e.fibre || 0), sodium: a.sodium + (e.sodium || 0) }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0 });
  const close = (v, goal) => Math.max(0, 1 - Math.abs(v - goal) / goal);
  const parts = [
    ['Calories on target', close(t.kcal, targets.kcal), 30],
    ['Protein', Math.min(1, t.protein / targets.protein), 25],
    ['Carbohydrate for training', close(t.carbs, targets.carbs), 15],
    ['Fibre', Math.min(1, t.fibre / targets.fibre), 15],
    ['Sodium under 2,000 mg', t.sodium <= 2000 ? 1 : Math.max(0, 1 - (t.sodium - 2000) / 2000), 15],
  ];
  const score = Math.round(parts.reduce((a, [, v, w]) => a + v * w, 0));
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'E';
  const priorities = parts
    .filter(([, v]) => v < 0.8)
    .sort((a, b) => a[1] * a[2] - b[1] * b[2])
    .slice(0, 3)
    .map(([label]) =>
      label === 'Protein'
        ? `Add ${Math.max(0, Math.round(targets.protein - t.protein))} g protein, e.g. a Citrus Herb Chicken bowl.`
        : label === 'Fibre'
          ? `Add ${Math.max(0, Math.round(targets.fibre - t.fibre))} g fibre: fruit, vegetables, wholegrains.`
          : label === 'Sodium under 2,000 mg'
            ? 'Cut back on gravy, soup stock and sauces to bring sodium under 2,000 mg.'
            : label === 'Calories on target'
              ? t.kcal < targets.kcal
                ? `You are ${Math.round(targets.kcal - t.kcal)} kcal short of your target.`
                : `You are ${Math.round(t.kcal - targets.kcal)} kcal over your target.`
              : t.carbs < targets.carbs
                ? 'Add carbohydrate around training: rice, oats, sweet potato or fruit.'
                : 'Ease off refined carbohydrate later in the day.',
    );
  return { score, grade, totals: t, priorities };
}

// ---------------------------------------------------------------- actions

function validStats(s) {
  const ok = s && s.age >= 13 && s.age <= 100 && s.heightCm >= 120 && s.heightCm <= 230 && s.weightKg >= 30 && s.weightKg <= 250 && ['male', 'female'].includes(s.sex) && ACTIVITY[s.activity];
  if (!ok) throw Object.assign(new Error('Please check your age (13–100), height (120–230 cm), weight (30–250 kg), sex and activity level.'), { status: 400 });
  return { ...s, trainingMin: Math.max(0, Math.min(600, Number(s.trainingMin) || 0)), goal: s.goal || 'maintain', diet: s.diet || 'balanced' };
}

async function viaNutriBalance(action, ctx) {
  const { tools: list } = await tools();
  const tool = pickTool(list, action);
  if (!tool) throw new Error(`NutriBalance has no tool for "${action}"`);
  const args = buildArgs(tool, ctx);
  const { data, text } = parseResult(await callTool(tool.name, args));
  return { tool: tool.name, data, text };
}

const actions = {
  async targets({ stats }) {
    const s = validStats(stats);
    const est = estimateTargets(s);
    try {
      const { tool, data, text } = await viaNutriBalance('targets', { stats: s });
      const get = (re) => findNum(data, re, text);
      // Accept a number only if it is plausible for that field; otherwise keep our estimate.
      const sane = (v, lo, hi, fallback) => (typeof v === 'number' && v >= lo && v <= hi ? Math.round(v) : fallback);
      const kcal = get(/target.?cal|daily.?cal|calorie.?target|goal.?cal/) ?? get(/calorie|kcal/);
      const merged = {
        ...est,
        bmr: sane(get(/bmr/), 800, 4000, est.bmr),
        tdee: sane(get(/tdee|maintenance/), 1000, 7000, est.tdee),
        kcal: sane(kcal, 1000, 7000, est.kcal),
        protein: sane(get(/protein.?(g|gram)/) ?? get(/protein/), 30, 400, est.protein),
        carbs: sane(get(/carb\w*.?(g|gram)/) ?? get(/carb/), 10, 1000, est.carbs),
        fat: sane(get(/fat.?(g|gram)/) ?? get(/^fat|total.?fat/), 15, 400, est.fat),
      };
      const used = ['bmr', 'tdee', 'kcal', 'protein', 'carbs', 'fat'].filter((k) => merged[k] !== est[k]);
      if (!used.length) throw new Error('NutriBalance reply had no usable numbers');
      return { source: 'nutribalance', tool, targets: merged, fromNutriBalance: used, note: snippet(text) };
    } catch (err) {
      return { source: 'estimate', targets: est, reason: err.message };
    }
  },

  async food({ query, grams }) {
    const q = String(query || '').trim().slice(0, 80);
    const g = Math.max(1, Math.min(2000, Number(grams) || 100));
    if (!q) throw Object.assign(new Error('Enter a food name.'), { status: 400 });
    try {
      const { tool, data, text } = await viaNutriBalance('food', { query: q, grams: g });
      const get = (re) => findNum(data, re, text);
      const kcal = get(/calorie|kcal|energy/);
      if (kcal === undefined) throw new Error('NutriBalance reply had no calories');
      const r1 = (n) => (n === undefined ? 0 : Math.round(n * 10) / 10);
      return {
        source: 'nutribalance',
        tool,
        food: { name: q, grams: g, kcal: Math.round(kcal), protein: r1(get(/protein/)), carbs: r1(get(/carb/)), fat: r1(get(/^fat|fat$|total.?fat/)), fibre: r1(get(/fib/)), sodium: Math.round(get(/sodium/) ?? 0) },
      };
    } catch (err) {
      const food = estimateFood(q, g);
      if (!food) throw Object.assign(new Error(`We couldn’t find “${q}”. Try a simpler name like “chicken rice” or “banana”.`), { status: 404 });
      return { source: 'estimate', food, reason: err.message };
    }
  },

  async score({ stats, targets, log }) {
    const s = validStats(stats);
    const entries = Array.isArray(log) ? log.slice(0, 60) : [];
    const est = estimateScore(targets, entries);
    try {
      const { tool, data, text } = await viaNutriBalance('score', { stats: s, targets, log: entries });
      const score = findNum(data, /score/, text);
      if (score === undefined) throw new Error('NutriBalance reply had no score');
      const gradeMatch = JSON.stringify(data ?? '').match(/"grade"\s*:\s*"([A-F][+-]?)"/i) || (text || '').match(/grade[^A-Za-z]{0,6}([A-F][+-]?)\b/);
      const pri = data && (data.priorities || data.improvements || data.recommendations || data.suggestions);
      return {
        source: 'nutribalance',
        tool,
        score: Math.round(score),
        grade: gradeMatch ? gradeMatch[1].toUpperCase() : est.grade,
        totals: est.totals,
        priorities: Array.isArray(pri) ? pri.map((p) => (typeof p === 'string' ? p : p.text || p.action || JSON.stringify(p))).slice(0, 4) : est.priorities,
        note: snippet(text),
      };
    } catch (err) {
      return { source: 'estimate', ...est, reason: err.message };
    }
  },

  async plan({ stats, targets }) {
    const s = validStats(stats);
    try {
      const { tool, data, text } = await viaNutriBalance('plan', { stats: s, targets });
      const meals = data && (data.meals || data.plan || data.mealPlan || data.day);
      if (!Array.isArray(meals) || !meals.length) {
        if (!text) throw new Error('NutriBalance reply had no meals');
        return { source: 'nutribalance', tool, meals: [], text: text.slice(0, 2000) };
      }
      return {
        source: 'nutribalance',
        tool,
        meals: meals.slice(0, 8).map((m) => ({
          slot: m.meal || m.slot || m.type || m.name || 'Meal',
          items: Array.isArray(m.foods || m.items) ? (m.foods || m.items).map((f) => (typeof f === 'string' ? f : f.name || f.food)).join(', ') : m.description || m.food || m.name || '',
          kcal: Math.round(findNum(m, /calorie|kcal/) ?? 0),
          protein: Math.round(findNum(m, /protein/) ?? 0),
        })),
      };
    } catch (err) {
      const k = targets?.kcal || estimateTargets(s).kcal;
      const veg = s.diet === 'vegetarian' || s.diet === 'vegan';
      const share = [0.25, 0.1, 0.3, 0.1, 0.25];
      const day = [
        ['Breakfast', veg ? 'Overnight oats with soy milk, banana and peanut butter' : 'Oats with Greek yogurt, banana and honey'],
        ['Pre-training snack', 'Banana and a small handful of nuts'],
        ['Lunch', veg ? 'Yong tau foo (tofu, greens), brown rice, less gravy' : 'Fish soup with brown rice, extra greens'],
        ['Post-training recovery', veg ? 'ActiveNutri Tempeh Quinoa Bowl' : 'ActiveNutri Citrus Herb Chicken'],
        ['Dinner', veg ? 'Tofu and vegetable stir-fry with brown rice' : 'ActiveNutri Sous-vide Salmon with extra greens'],
      ];
      return {
        source: 'estimate',
        reason: err.message,
        meals: day.map(([slot, items], i) => ({ slot, items, kcal: Math.round(k * share[i]), protein: Math.round((targets?.protein || 100) * share[i]) })),
      };
    }
  },
};

// ---------------------------------------------------------------- handler

export async function probeNutriBalance() {
  const started = Date.now();
  const out = { endpoint: NUTRIBALANCE_URL, reachable: false, httpStatus: null, latencyMs: null, tools: [], error: null };
  try {
    const res = await post({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'activenutri-health', version: '1.4.0' } } });
    out.latencyMs = Date.now() - started;
    out.httpStatus = res.status;
    out.reachable = res.status >= 200 && res.status <= 499;
    await res.body?.cancel?.();
    if (res.ok) out.tools = (await tools()).tools.map((t) => t.name);
  } catch (err) {
    out.latencyMs = Date.now() - started;
    out.error = err?.name === 'AbortError' ? `Timed out after ${TIMEOUT_MS} ms` : err.message || 'Network error';
  }
  return out;
}

export default async function nutritionHandler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  const fn = actions[body?.action];
  if (!fn) return res.status(400).json({ error: 'Unknown action' });
  try {
    return res.status(200).json(await fn(body));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong. Please try again.' });
  }
}
