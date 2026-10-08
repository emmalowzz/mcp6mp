import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getHealth, type HealthReport } from './mcp';
import type { MealId } from '../data/catalog';

export type Screen = 'overview' | 'nutrition' | 'venues' | 'dispensers' | 'partners';

export type ModalState =
  | { type: 'mcp' }
  | { type: 'nfc'; podId?: string; passcode?: string }
  | { type: 'reserve'; mealId: MealId; podId?: string }
  | { type: 'meal'; mealId: MealId }
  | { type: 'start'; tier?: string }
  | null;

export type Reservation = { mealId: MealId; podId: string; passcode: string; priceSgd: number; createdAt: number };

export type Profile = { name: string; sport: string; trainingDays: number; goal: string; diet: string; tier: string };

type Store = {
  screen: Screen;
  go: (s: Screen) => void;
  modal: ModalState;
  open: (m: ModalState) => void;
  close: () => void;
  voucher: string | null;
  redeemVoucher: (code: string) => boolean;
  voucherUsed: boolean;
  reservations: Reservation[];
  addReservation: (r: Reservation) => void;
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  health: HealthReport | null;
  healthError: string | null;
  healthLoading: boolean;
  refreshHealth: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export const VOUCHER_CODE = 'PULSE-FIRST-SG';
export const VOUCHER_DISCOUNT = 0.3;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('overview');
  const [modal, setModal] = useState<ModalState>(null);
  const [voucher, setVoucher] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      setHealth(await getHealth());
      setHealthError(null);
    } catch (e) {
      setHealthError((e as Error).message);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const t = setInterval(refreshHealth, 60_000);
    return () => clearInterval(t);
  }, [refreshHealth]);

  const redeemVoucher = useCallback(
    (code: string) => {
      if (code.trim().toUpperCase() !== VOUCHER_CODE || reservations.length > 0) return false;
      setVoucher(VOUCHER_CODE);
      return true;
    },
    [reservations.length],
  );

  const addReservation = useCallback((r: Reservation) => {
    setReservations((list) => [r, ...list]);
    setVoucher(null);
  }, []);

  const value = useMemo<Store>(
    () => ({
      screen,
      go,
      modal,
      open: setModal,
      close: () => setModal(null),
      voucher,
      redeemVoucher,
      voucherUsed: reservations.length > 0,
      reservations,
      addReservation,
      profile,
      setProfile,
      health,
      healthError,
      healthLoading,
      refreshHealth,
    }),
    [screen, go, modal, voucher, redeemVoucher, reservations, addReservation, profile, health, healthError, healthLoading, refreshHealth],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export function passcode() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1_000_000).padStart(6, '0');
}

export const sgd = (n: number) => `S$${n.toLocaleString('en-SG', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
