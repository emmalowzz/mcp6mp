// Browser client for the server-side tool routes. No credentials live here.

let rpcId = 0;

async function rpc<T>(method: string, params?: unknown): Promise<T> {
  const res = await fetch('/api/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result as T;
}

export async function callTool<T = Record<string, unknown>>(name: string, args: Record<string, unknown>): Promise<T> {
  const result = await rpc<{ isError: boolean; structuredContent?: T; content: { text: string }[] }>('tools/call', {
    name,
    arguments: args,
  });
  if (result.isError) throw new Error(result.content?.[0]?.text || 'Request failed');
  return result.structuredContent as T;
}

export type RecoveryResult = {
  inputs: { weight_kg: number; duration_min: number; intensity: string; sport: string | null; goal: string };
  targets: { carbs_g: number; protein_g: number; fat_g: number; kcal: number; fluid_ml: number; sodium_mg: number };
  window: string;
  recommended_meal: string;
  guidance: string;
};

export type BookingResult = {
  status: string;
  reference: string;
  venue: string;
  sport: string;
  court: string;
  date: string;
  slot: string;
  players: number;
  fee_sgd: number;
  note: string;
};

export type LockerResult = {
  status: string;
  pod_id: string;
  locker: string;
  zone: string;
  method: string;
  relatch_after_s: number;
  issued_at: string;
};

// ---- Personalised daily nutrition (/api/nutrition)

export type Stats = {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  trainingMin: number;
  goal: 'lose' | 'maintain' | 'gain';
  diet: 'balanced' | 'vegetarian' | 'vegan' | 'keto' | 'high_protein';
};

export type Targets = {
  bmr: number;
  tdee: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  waterMl: number;
  micros: { name: string; amount: number; unit: string }[];
};

export type FoodEntry = { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number; fibre: number; sodium: number };

type Source = { source: 'nutribalance' | 'estimate'; tool?: string; reason?: string };

export type TargetsResult = Source & { targets: Targets; fromNutriBalance?: string[]; note?: string | null };
export type FoodResult = Source & { food: FoodEntry };
export type ScoreResult = Source & { score: number; grade: string; priorities: string[]; note?: string | null };
export type PlanResult = Source & { meals: { slot: string; items: string; kcal: number; protein: number }[]; text?: string };

async function nutrition<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/nutrition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Server returned HTTP ${res.status}`);
  return data as T;
}

export const getTargets = (stats: Stats) => nutrition<TargetsResult>({ action: 'targets', stats });
export const lookupFood = (query: string, grams: number) => nutrition<FoodResult>({ action: 'food', query, grams });
export const scoreDay = (stats: Stats, targets: Targets, log: FoodEntry[]) => nutrition<ScoreResult>({ action: 'score', stats, targets, log });
export const planDay = (stats: Stats, targets: Targets) => nutrition<PlanResult>({ action: 'plan', stats, targets });
