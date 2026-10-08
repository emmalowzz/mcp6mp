import { useState } from 'react';
import { ArrowLeft, Check, Fingerprint, ShieldCheck } from 'lucide-react';
import { Button, Field, Modal, Segmented, inputCls, cx } from '../components/ui';
import { sgd, useStore } from '../lib/store';
import { tiers } from '../data/catalog';

const SPORTS = ['Running', 'Badminton', 'Football', 'Basketball', 'Swimming', 'Cycling', 'Strength training', 'Netball'];

export function GetStarted({ tier: initialTier }: { tier?: string }) {
  const { close, profile, setProfile, go } = useStore();
  const [step, setStep] = useState(profile ? 1 : 0);
  const [provider, setProvider] = useState<'singpass' | 'myactivesg' | null>(null);
  const [authing, setAuthing] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [sport, setSport] = useState(profile?.sport ?? 'Running');
  const [days, setDays] = useState(profile?.trainingDays ?? 4);
  const [goal, setGoal] = useState(profile?.goal ?? 'recover');
  const [diet, setDiet] = useState(profile?.diet ?? 'none');
  const [tier, setTier] = useState(initialTier ?? profile?.tier ?? 'athlete');

  function auth(p: 'singpass' | 'myactivesg') {
    setProvider(p);
    setAuthing(true);
    setTimeout(() => {
      setAuthing(false);
      if (!name) setName('Alex Tan');
      setStep(1);
    }, 1100);
  }

  function finish() {
    setProfile({ name: name.trim() || 'Athlete', sport, trainingDays: days, goal, diet, tier });
    setStep(3);
  }

  const titles = ['Get started', 'Your training profile', 'Choose a plan', 'You’re all set'];

  return (
    <Modal title={titles[step]} onClose={close}>
      {step > 0 && step < 3 && (
        <div className="mb-4 flex gap-1.5">
          {[1, 2].map((i) => (
            <div key={i} className={cx('h-1 flex-1 rounded-full', i <= step ? 'bg-pulse' : 'bg-black/10')} />
          ))}
        </div>
      )}

      {step === 0 && (
        <div className="grid gap-3">
          <p className="text-[15px] text-muted">Sign in with a trusted Singapore identity to pre-fill your profile and link your ActiveSG bookings.</p>
          <button
            onClick={() => auth('singpass')}
            disabled={authing}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f4333d] text-[15px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            <Fingerprint size={18} /> {authing && provider === 'singpass' ? 'Waiting for Singpass app…' : 'Log in with Singpass'}
          </button>
          <button
            onClick={() => auth('myactivesg')}
            disabled={authing}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-hair text-[15px] font-semibold hover:bg-black/[.03] disabled:opacity-60"
          >
            <ShieldCheck size={18} /> {authing && provider === 'myactivesg' ? 'Connecting MyActiveSG…' : 'Continue with MyActiveSG'}
          </button>
          <button onClick={() => setStep(1)} className="text-[13px] font-semibold text-link">
            Skip and fill in manually
          </button>
          <p className="text-[11px] text-muted">
            Demo sign-in: no real Singpass or ActiveSG request is made. Under the PDPA we would only request name and ActiveSG membership ID, with your consent.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4">
          {provider && <p className="text-[13px] text-pulse">Verified with {provider === 'singpass' ? 'Singpass' : 'MyActiveSG'} (demo)</p>}
          <Field label="Name">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Main sport">
            <select className={inputCls} value={sport} onChange={(e) => setSport(e.target.value)}>
              {SPORTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label={`Training days per week · ${days}`}>
            <input type="range" min={1} max={7} value={days} onChange={(e) => setDays(+e.target.value)} className="accent-pulse" />
          </Field>
          <div className="grid gap-1.5">
            <span className="text-[13px] font-medium text-muted">Goal</span>
            <Segmented label="Goal" value={goal} onChange={setGoal} options={[{ id: 'recover', label: 'Recover faster' }, { id: 'build', label: 'Build muscle' }, { id: 'lean', label: 'Lean out' }]} />
          </div>
          <div className="grid gap-1.5">
            <span className="text-[13px] font-medium text-muted">Dietary needs</span>
            <Segmented label="Diet" value={diet} onChange={setDiet} options={[{ id: 'none', label: 'None' }, { id: 'halal', label: 'Halal' }, { id: 'vegetarian', label: 'Vegetarian' }, { id: 'no-seafood', label: 'No seafood' }]} />
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!name.trim()}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-3">
          {tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              aria-pressed={tier === t.id}
              className={cx('flex items-center gap-3 rounded-2xl border p-4 text-left transition', tier === t.id ? 'border-pulse bg-pulse-soft' : 'border-hair hover:border-ink/30')}
            >
              <div className="flex-1">
                <p className="text-[16px] font-semibold">{t.name}</p>
                <p className="text-[12px] text-muted">{t.audience}</p>
              </div>
              <p className="text-right font-bold tabular-nums">
                {sgd(t.price)}
                <span className="block text-[11px] font-normal text-muted">/ {t.period}</span>
              </p>
            </button>
          ))}
          <div className="mt-2 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={finish}>Create my plan</Button>
          </div>
          <p className="text-[11px] text-muted">No payment is taken in this demo.</p>
        </div>
      )}

      {step === 3 && (
        <div className="anim-rise text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pulse-soft text-pulse">
            <Check />
          </span>
          <p className="mt-3 text-[15px]">
            Welcome, <span className="font-semibold">{name.trim() || 'Athlete'}</span>. Your {tiers.find((t) => t.id === tier)?.name} plan is tuned for {days} {sport.toLowerCase()} sessions a week.
          </p>
          <p className="mt-2 text-[13px] text-muted">First meal? Use code PULSE-FIRST-SG for 30% off.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => { close(); go('venues'); }}>
              Book a court
            </Button>
            <Button onClick={() => { close(); go('nutrition'); }}>Browse recovery meals</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
