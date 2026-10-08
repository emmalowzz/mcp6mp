import { Activity, Building2, Gauge, LayoutGrid, MapPin, Refrigerator, Salad, ShoppingBag } from 'lucide-react';
import { useStore, type Screen } from './lib/store';
import { cx } from './components/ui';
import { Footer } from './components/Footer';
import { Overview } from './screens/Overview';
import { Nutrition } from './screens/Nutrition';
import { Venues } from './screens/Venues';
import { Dispensers } from './screens/Dispensers';
import { Partners } from './screens/Partners';
import { DailyNeeds } from './screens/DailyNeeds';
import { NfcUnlatch } from './modals/NfcUnlatch';
import { MealReservation } from './modals/MealReservation';
import { GetStarted } from './modals/GetStarted';
import { MealDetail } from './modals/MealDetail';

const NAV: { id: Screen; label: string; short: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', short: 'Overview', icon: LayoutGrid },
  { id: 'nutrition', label: 'Nutrition & Meals', short: 'Meals', icon: Salad },
  { id: 'needs', label: 'My Daily Needs', short: 'Needs', icon: Gauge },
  { id: 'venues', label: 'Sports Venues', short: 'Venues', icon: MapPin },
  { id: 'dispensers', label: 'Smart Dispensers', short: 'Pods', icon: Refrigerator },
  { id: 'partners', label: 'For Partners', short: 'Partners', icon: Building2 },
];

export default function App() {
  const { screen, go, modal, open, profile, reservations } = useStore();

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <button onClick={() => go('overview')} className="flex items-center gap-2" aria-label="ActiveNutri home">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-pulse text-white">
              <Activity size={16} strokeWidth={2.5} />
            </span>
            <span className="text-[17px] font-bold tracking-tight">ActiveNutri</span>
          </button>
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                aria-current={screen === n.id ? 'page' : undefined}
                className={cx(
                  'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition',
                  screen === n.id ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {reservations.length > 0 && (
              <button
                onClick={() => go('dispensers')}
                className="flex h-8 items-center gap-1.5 rounded-full bg-pulse-soft px-3 text-[13px] font-semibold text-pulse hover:brightness-95"
              >
                <ShoppingBag size={15} /> <span className="tabular-nums">{reservations.length}</span>
                <span className="hidden sm:inline">My orders</span>
              </button>
            )}
            <button
              onClick={() => open({ type: 'start' })}
              className="h-8 whitespace-nowrap rounded-full bg-pulse px-3.5 text-[13px] font-semibold text-white hover:brightness-110"
            >
              {profile ? `Hi, ${profile.name.split(' ')[0]}` : 'Get Started'}
            </button>
          </div>
        </div>
      </header>

      <main key={screen} className="anim-rise mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {screen === 'overview' && <Overview />}
        {screen === 'nutrition' && <Nutrition />}
        {screen === 'needs' && <DailyNeeds />}
        {screen === 'venues' && <Venues />}
        {screen === 'dispensers' && <Dispensers />}
        {screen === 'partners' && <Partners />}
      </main>

      <Footer />

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-black/5 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            aria-current={screen === n.id ? 'page' : undefined}
            className={cx('flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium', screen === n.id ? 'text-pulse' : 'text-muted')}
          >
            <n.icon size={20} strokeWidth={screen === n.id ? 2.4 : 1.8} />
            {n.short}
          </button>
        ))}
      </nav>

      {modal?.type === 'nfc' && <NfcUnlatch podId={modal.podId} passcode={modal.passcode} />}
      {modal?.type === 'reserve' && <MealReservation mealId={modal.mealId} podId={modal.podId} />}
      {modal?.type === 'start' && <GetStarted tier={modal.tier} />}
      {modal?.type === 'meal' && <MealDetail mealId={modal.mealId} />}
    </div>
  );
}
