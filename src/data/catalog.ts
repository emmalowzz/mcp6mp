export type MealId = 'sous-vide-salmon' | 'citrus-herb-chicken' | 'tempeh-quinoa' | 'bone-broth-congee';

export type Meal = {
  id: MealId;
  name: string;
  tagline: string;
  blurb: string;
  ingredients: string[];
  allergens: string;
  goodFor: string;
  note: string;
  /** Optional real photo, e.g. '/meals/sous-vide-salmon.jpg' (put the file in public/meals/). */
  photo?: string;
  kitchen: string;
  priceSgd: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: Category[];
  zone: 'Cryo 4°C' | 'Thermal 65°C';
  hue: string;
};

export type Category = 'all' | 'high-protein' | 'plant-based' | 'low-gi' | 'gut-friendly' | 'halal';

export const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high-protein', label: 'High protein' },
  { id: 'plant-based', label: 'Plant-based' },
  { id: 'low-gi', label: 'Low GI' },
  { id: 'gut-friendly', label: 'Gut-friendly' },
  { id: 'halal', label: 'Halal' },
];

export const meals: Meal[] = [
  {
    id: 'sous-vide-salmon',
    name: 'Sous-vide Salmon',
    tagline: "Buttery, flaky salmon with a miso-ginger glaze",
    blurb: 'Norwegian salmon at 52°C, brown rice, edamame and miso-ginger greens.',
    ingredients: ["Norwegian salmon, sous-vide 52\u00b0C", "Brown rice", "Edamame", "Miso-ginger greens", "Spring onion, sesame, lime"],
    allergens: "Fish, soy, sesame",
    goodFor: "Endurance runs, swims and long rides",
    note: "Omega-3s help calm post-session inflammation; the brown rice refills glycogen without a sugar spike.",
    kitchen: 'Kitchen Collective, Tai Seng',
    priceSgd: 14.9,
    kcal: 620,
    protein: 42,
    carbs: 58,
    fat: 22,
    tags: ['high-protein', 'low-gi'],
    zone: 'Cryo 4°C',
    hue: '#f97362',
  },
  {
    id: 'citrus-herb-chicken',
    name: 'Citrus Herb Chicken',
    tagline: "Smoky grilled thigh, bright calamansi glaze",
    blurb: 'Lemongrass-calamansi chicken thigh, sweet potato mash and charred broccolini.',
    ingredients: ["Lemongrass-calamansi chicken thigh", "Roasted sweet potato mash", "Charred broccolini", "Calamansi halves, herbs"],
    allergens: "No common allergens",
    goodFor: "Strength, power and team-sport sessions",
    note: "45 g protein hits the muscle-repair window; sweet potato brings slow carbs and potassium lost in sweat.",
    kitchen: 'GrainHaus Central Kitchen, Jurong',
    priceSgd: 12.5,
    kcal: 580,
    protein: 45,
    carbs: 62,
    fat: 14,
    tags: ['high-protein', 'halal'],
    zone: 'Thermal 65°C',
    hue: '#f5b83d',
  },
  {
    id: 'tempeh-quinoa',
    name: 'Tempeh Quinoa Bowl',
    tagline: "Sweet-savoury kecap tempeh with a lime crunch",
    blurb: 'Kecap-glazed tempeh, tri-colour quinoa, pickled carrot, kale and peanut-lime dressing.',
    ingredients: ["Kecap manis-glazed tempeh", "Tri-colour quinoa", "Kale", "Pickled carrot", "Peanut-lime dressing, chilli, coriander"],
    allergens: "Soy, peanuts",
    goodFor: "Plant-based athletes and rest days",
    note: "Tempeh and quinoa together give a complete plant protein; fermented tempeh is easy on the gut.",
    kitchen: 'Green Ladle Cloud Kitchen, Kallang',
    priceSgd: 11.9,
    kcal: 540,
    protein: 31,
    carbs: 64,
    fat: 17,
    tags: ['plant-based', 'low-gi', 'halal'],
    zone: 'Cryo 4°C',
    hue: '#5bbf7a',
  },
  {
    id: 'bone-broth-congee',
    name: 'Warm Bone Broth Congee',
    tagline: "Silky 12-hour broth congee, soft egg on top",
    blurb: '12-hour chicken bone broth congee, shredded chicken, ginger, spring onion and egg.',
    ingredients: ["12-hour chicken bone broth", "Rice congee", "Shredded chicken", "Soft-boiled egg", "Ginger, spring onion, fried shallots"],
    allergens: "Egg",
    goodFor: "Late sessions, rehab days and sensitive stomachs",
    note: "Warm, salty and gentle: replaces sodium after heavy sweating and is easy to eat when appetite is low.",
    kitchen: 'Kitchen Collective, Tai Seng',
    priceSgd: 9.9,
    kcal: 430,
    protein: 28,
    carbs: 52,
    fat: 10,
    tags: ['gut-friendly', 'halal'],
    zone: 'Thermal 65°C',
    hue: '#a78bfa',
  },
];

// Athlete plan: S$89 for 20 meals.
export const ATHLETE_PER_MEAL = 89 / 20;
export const avgMealPrice = meals.reduce((a, m) => a + m.priceSgd, 0) / meals.length;

export const mealById = (id: string) => meals.find((m) => m.id === id) ?? meals[0];

export type VenueId = 'clementi' | 'bishan' | 'jurong-east' | 'kallang';

export type Venue = {
  id: VenueId;
  name: string;
  short: string;
  lat: number;
  lng: number;
  address: string;
  courts: string[];
  podId: string;
};

export const venues: Venue[] = [
  {
    id: 'clementi',
    name: 'Clementi Sports Centre',
    short: 'Clementi',
    lat: 1.311,
    lng: 103.765,
    address: '518 Clementi Ave 3',
    courts: ['Badminton', 'Basketball', 'Squash', 'Table Tennis'],
    podId: 'POD-08',
  },
  {
    id: 'bishan',
    name: 'Bishan Sports Hall',
    short: 'Bishan',
    lat: 1.3555,
    lng: 103.851,
    address: '5 Bishan Street 14',
    courts: ['Badminton', 'Basketball', 'Volleyball', 'Futsal'],
    podId: 'POD-03',
  },
  {
    id: 'jurong-east',
    name: 'Jurong East Sports Centre',
    short: 'Jurong East',
    lat: 1.3466,
    lng: 103.729,
    address: '21 Jurong East Street 31',
    courts: ['Badminton', 'Tennis', 'Futsal', 'Squash'],
    podId: 'POD-16',
  },
  {
    id: 'kallang',
    name: 'OCBC Arena, Kallang',
    short: 'Kallang',
    lat: 1.303,
    lng: 103.8745,
    address: '5 Stadium Drive',
    courts: ['Badminton', 'Basketball', 'Netball', 'Volleyball'],
    podId: 'POD-20',
  },
];

export type Region = 'North' | 'North-East' | 'East' | 'West' | 'Central';

export type Pod = {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lng: number;
  status: 'online' | 'restocking' | 'maintenance';
  stock: number;
  capacity: number;
};

const podSeed: [string, Region, number, number][] = [
  ['Ang Mo Kio Swimming Complex', 'North-East', 1.3718, 103.8459],
  ['Bedok Sports Centre', 'East', 1.3262, 103.9323],
  ['Bishan Sports Hall', 'Central', 1.3555, 103.851],
  ['Bukit Batok Swimming Complex', 'West', 1.3504, 103.7491],
  ['Bukit Canberra', 'North', 1.4483, 103.8235],
  ['Bukit Gombak Sports Centre', 'West', 1.3593, 103.7518],
  ['Choa Chu Kang Sports Centre', 'West', 1.3911, 103.7472],
  ['Clementi Sports Centre', 'West', 1.311, 103.765],
  ['Delta Sports Centre', 'Central', 1.2902, 103.8256],
  ['Enabling Village', 'Central', 1.2884, 103.8174],
  ['Farrer Park Field', 'Central', 1.3125, 103.8526],
  ['Heartbeat@Bedok', 'East', 1.3274, 103.9326],
  ['Hougang Sports Centre', 'North-East', 1.3707, 103.8888],
  ['Jalan Besar Sports Centre', 'Central', 1.3101, 103.8601],
  ['Jurong East Swimming Complex', 'West', 1.3462, 103.7293],
  ['Jurong East Sports Centre', 'West', 1.3466, 103.729],
  ['Jurong West Sports Centre', 'West', 1.3383, 103.6941],
  ['Kallang Basin Swimming Complex', 'Central', 1.3175, 103.8713],
  ['Kallang Wave Mall', 'Central', 1.3025, 103.8752],
  ['OCBC Arena, Kallang', 'Central', 1.303, 103.8745],
  ['Pasir Ris Sports Centre', 'East', 1.3739, 103.952],
  ['Punggol Sports Centre', 'North-East', 1.4049, 103.9022],
  ['Queenstown Sports Centre', 'Central', 1.2966, 103.8035],
  ['Sengkang Sports Centre', 'North-East', 1.3961, 103.8865],
  ['Serangoon Sports Centre', 'North-East', 1.3536, 103.8717],
  ['Tampines Hub', 'East', 1.3533, 103.9405],
  ['Toa Payoh Sports Centre', 'Central', 1.3311, 103.8509],
  ['Woodlands Sports Centre', 'North', 1.4342, 103.7795],
  ['Yio Chu Kang Sports Centre', 'North-East', 1.3818, 103.8448],
  ['Yishun Sports Centre', 'North', 1.4116, 103.8318],
  ['Sembawang Sports Centre', 'North', 1.4486, 103.8203],
  ['Bukit Timah Sports Hall', 'Central', 1.3402, 103.7764],
  ['Geylang East Sports Centre', 'East', 1.3184, 103.8879],
  ['Katong Swimming Complex', 'East', 1.3022, 103.8936],
  ['MacPherson Sports Centre', 'East', 1.3264, 103.8873],
  ['Senja-Cashew Sports Centre', 'West', 1.3826, 103.7633],
  ['Boon Lay Sports Hall', 'West', 1.3467, 103.7104],
  ['Pioneer Sports Centre', 'West', 1.3413, 103.6973],
  ['Tanjong Pagar Hub', 'Central', 1.2764, 103.8436],
  ['Marine Parade Sports Hall', 'East', 1.3029, 103.9073],
  ['Potong Pasir Sports Centre', 'Central', 1.3315, 103.8688],
  ['Khatib Sports Hall', 'North', 1.4171, 103.8329],
  ['Bedok Reservoir Park', 'East', 1.3428, 103.9244],
  ['Changi Sports Hall', 'East', 1.3573, 103.9878],
  ['Admiralty Sports Hall', 'North', 1.4405, 103.8009],
  ['Jurong Lake Gardens', 'West', 1.3393, 103.7262],
  ['Toa Payoh West Pod', 'Central', 1.3352, 103.8441],
  ['Singapore Sports Hub', 'Central', 1.3043, 103.8748],
];

export const pods: Pod[] = podSeed.map(([name, region, lat, lng], i) => {
  const capacity = 24;
  const status: Pod['status'] = i % 17 === 9 ? 'maintenance' : i % 11 === 4 ? 'restocking' : 'online';
  return {
    id: `POD-${String(i + 1).padStart(2, '0')}`,
    name,
    region,
    lat,
    lng,
    status,
    capacity,
    stock: status === 'maintenance' ? 0 : 6 + ((i * 7) % 18),
  };
});

export const tiers = [
  {
    id: 'community',
    name: 'Community',
    price: 0,
    period: 'forever',
    audience: 'People starting healthier habits, seniors and casual players',
    features: ['Recovery calculator', 'Pay-per-meal pod pickup', 'ActiveSG court search', 'Monthly nutrition summary'],
  },
  {
    id: 'athlete',
    name: 'Athlete',
    price: 89,
    period: 'month',
    audience: 'Individual endurance, strength and power athletes',
    features: [
      '20 recovery meals a month',
      'Training-day presets and one-tap reorder',
      'Court Booking Bot (3 armed bots)',
      'Snap & Calculate unlimited',
      'Chat with a nutritionist',
    ],
  },
  {
    id: 'academy',
    name: 'Academy',
    price: 1000,
    period: 'month',
    audience: 'Clubs, academies and teams managing many players',
    features: [
      'Centralised team meal planning',
      'Up to 25 athlete profiles',
      'Priority pod restock at home venue',
      'AHPC physio and sports-massage credits',
      'Performance analytics and monthly review',
    ],
  },
] as const;

// Project lat/lng into the 0–100 map canvas used by MapCanvas.
export const BOUNDS = { minLat: 1.215, maxLat: 1.475, minLng: 103.6, maxLng: 104.05 };
export function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x, y };
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}
