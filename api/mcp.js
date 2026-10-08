// /api/mcp — MCP tool proxy (JSON-RPC 2.0 over HTTP, stateless).
// GET returns a manifest; POST accepts initialize, ping, tools/list and tools/call.
// The three ActiveNutri tools are simulated server-side: nothing is charged,
// persisted or sent to third parties.

const PROTOCOL_VERSION = '2025-03-26';
const SERVER_INFO = { name: 'activenutri-mcp-proxy', version: '1.0.0' };
const GATEWAY = 'https://mcp.smithery.ai/emmalowzz';

const VENUES = {
  clementi: { name: 'Clementi Sports Centre', courts: ['Badminton', 'Basketball', 'Squash', 'Table Tennis'] },
  bishan: { name: 'Bishan Sports Hall', courts: ['Badminton', 'Basketball', 'Volleyball', 'Futsal'] },
  'jurong-east': { name: 'Jurong East Sports Centre', courts: ['Badminton', 'Tennis', 'Futsal', 'Squash'] },
  kallang: { name: 'OCBC Arena, Kallang', courts: ['Badminton', 'Basketball', 'Netball', 'Volleyball'] },
};

const INTENSITY = { low: 0.6, moderate: 1.0, high: 1.35, max: 1.6 };

const TOOLS = [
  {
    name: 'activesg_book_court',
    description: 'Reserve an ActiveSG court slot at a partner venue (simulated booking, no payment taken).',
    inputSchema: {
      type: 'object',
      properties: {
        venue: { type: 'string', enum: Object.keys(VENUES) },
        sport: { type: 'string', description: 'e.g. Badminton, Basketball' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        slot: { type: 'string', description: '24h start time, e.g. 19:00' },
        players: { type: 'integer', minimum: 1, maximum: 12 },
      },
      required: ['venue', 'sport', 'date', 'slot'],
    },
  },
  {
    name: 'calculate_recovery_macros',
    description:
      'Compute a post-workout recovery target (carbohydrate, protein, fat, fluid) from body mass, session length and intensity.',
    inputSchema: {
      type: 'object',
      properties: {
        weight_kg: { type: 'number', minimum: 30, maximum: 200 },
        duration_min: { type: 'number', minimum: 10, maximum: 360 },
        intensity: { type: 'string', enum: Object.keys(INTENSITY) },
        sport: { type: 'string' },
        goal: { type: 'string', enum: ['recover', 'build', 'lean'] },
      },
      required: ['weight_kg', 'duration_min', 'intensity'],
    },
  },
  {
    name: 'dispenser_claim_locker',
    description: 'Unlatch a Smart Dispenser locker at an ActiveSG pod for a reserved meal (15-second window).',
    inputSchema: {
      type: 'object',
      properties: {
        pod_id: { type: 'string', description: 'POD-01 … POD-48' },
        passcode: { type: 'string', description: '6-digit pickup passcode' },
        method: { type: 'string', enum: ['nfc', 'qr'] },
      },
      required: ['pod_id'],
    },
  },
];

// Small deterministic hash so the same request gives the same reference.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase();
}

const round = (n) => Math.round(n);

const handlers = {
  activesg_book_court(args) {
    const venue = VENUES[args.venue];
    if (!venue) throw new Error(`Unknown venue "${args.venue}"`);
    if (!venue.courts.includes(args.sport)) throw new Error(`${venue.name} has no ${args.sport} courts`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(args.date))) throw new Error('date must be YYYY-MM-DD');
    if (!/^\d{2}:\d{2}$/.test(String(args.slot))) throw new Error('slot must be HH:MM');
    const ref = `ASG-${hash(`${args.venue}|${args.sport}|${args.date}|${args.slot}`).slice(0, 6)}`;
    const court = (parseInt(hash(args.slot + args.date), 36) % 6) + 1;
    return {
      status: 'confirmed',
      simulated: true,
      reference: ref,
      venue: venue.name,
      sport: args.sport,
      court: `Court ${court}`,
      date: args.date,
      slot: args.slot,
      players: Number(args.players) || 2,
      fee_sgd: args.sport === 'Tennis' ? 8.4 : 5.6,
      note: 'Demo booking via ActiveNutri proxy. Confirm on the ActiveSG app before travelling.',
    };
  },

  calculate_recovery_macros(args) {
    const weight = Number(args.weight_kg);
    const duration = Number(args.duration_min);
    const factor = INTENSITY[args.intensity];
    if (!(weight >= 30 && weight <= 200)) throw new Error('weight_kg must be between 30 and 200');
    if (!(duration >= 10 && duration <= 360)) throw new Error('duration_min must be between 10 and 360');
    if (!factor) throw new Error('intensity must be low, moderate, high or max');
    const goal = args.goal || 'recover';

    // ~1.0–1.2 g/kg carbohydrate and ~0.3 g/kg protein in the first recovery window,
    // scaled by session load; fluid replaces ~150% of estimated sweat loss.
    const load = Math.min(1.6, (duration / 60) * factor);
    const carbs = weight * Math.min(1.2, 0.5 + 0.45 * load) * (goal === 'lean' ? 0.8 : 1);
    const protein = weight * (goal === 'build' ? 0.4 : 0.3);
    const fat = weight * 0.15;
    const kcal = carbs * 4 + protein * 4 + fat * 9;
    const sweatL = (duration / 60) * 0.9 * factor; // Singapore heat & humidity
    const fluid = sweatL * 1.5 * 1000;
    const sodium = sweatL * 900;

    const meal =
      protein >= 25 && carbs >= 80
        ? 'citrus-herb-chicken'
        : goal === 'lean'
          ? 'tempeh-quinoa'
          : carbs < 50
            ? 'bone-broth-congee'
            : 'sous-vide-salmon';

    return {
      simulated: false,
      inputs: { weight_kg: weight, duration_min: duration, intensity: args.intensity, sport: args.sport || null, goal },
      targets: {
        carbs_g: round(carbs),
        protein_g: round(protein),
        fat_g: round(fat),
        kcal: round(kcal),
        fluid_ml: round(fluid / 50) * 50,
        sodium_mg: round(sodium / 10) * 10,
      },
      window: 'Eat within 30–60 minutes after training.',
      recommended_meal: meal,
      guidance: 'General guidance aligned with HPB healthy-eating principles; not medical advice.',
    };
  },

  dispenser_claim_locker(args) {
    const match = /^POD-(\d{2})$/.exec(String(args.pod_id || ''));
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 48) throw new Error('pod_id must be POD-01 … POD-48');
    if (args.passcode && !/^\d{6}$/.test(String(args.passcode))) throw new Error('passcode must be 6 digits');
    const locker = (parseInt(hash(args.pod_id + (args.passcode || '')), 36) % 24) + 1;
    return {
      status: 'unlatched',
      simulated: true,
      pod_id: args.pod_id,
      locker: `L${String(locker).padStart(2, '0')}`,
      zone: locker % 2 ? 'Cryo 4°C' : 'Thermal 65°C',
      method: args.method || 'nfc',
      relatch_after_s: 15,
      issued_at: new Date().toISOString(),
    };
  },
};

function setHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version');
}

const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

function handleRpc(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(msg?.id, -32600, 'Invalid Request');
  }
  const { id, method, params = {} } = msg;
  const isNotification = id === undefined;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: `ActiveNutri tool proxy. Upstream gateway: ${GATEWAY}`,
        },
      };
    case 'notifications/initialized':
      return null;
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    case 'tools/call': {
      const fn = handlers[params.name];
      if (!fn) return rpcError(id, -32602, `Unknown tool: ${params.name}`);
      try {
        const data = fn(params.arguments || {});
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data, isError: false },
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: err.message }], isError: true },
        };
      }
    }
    default:
      return isNotification ? null : rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export default async function mcpProxyHandler(req, res) {
  setHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      server: SERVER_INFO,
      protocolVersion: PROTOCOL_VERSION,
      transport: 'POST JSON-RPC 2.0 to this URL',
      gateway: GATEWAY,
      tools: TOOLS.map(({ name, description }) => ({ name, description })),
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json(rpcError(null, -32600, 'Method not allowed'));
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json(rpcError(null, -32700, 'Parse error'));
    }
  }
  if (body == null) return res.status(400).json(rpcError(null, -32700, 'Parse error'));

  if (Array.isArray(body)) {
    const out = body.map(handleRpc).filter(Boolean);
    return out.length ? res.status(200).json(out) : res.status(202).end();
  }
  const out = handleRpc(body);
  return out ? res.status(200).json(out) : res.status(202).end();
}
