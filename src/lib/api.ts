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
