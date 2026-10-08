import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChefHat, HandCoins, HeartHandshake, Landmark, Trophy } from 'lucide-react';
import { Button, Card, Field, SectionHeader, inputCls, cx } from '../components/ui';

type Inquiry = { type: string; org: string; contact: string; email: string; size: string; message: string; consent: boolean };

function InquiryPipeline() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Inquiry>({ type: '', org: '', contact: '', email: '', size: '1–10', message: '', consent: false });
  const [ref, setRef] = useState<string | null>(null);
  const set = <K extends keyof Inquiry>(k: K, v: Inquiry[K]) => setForm((f) => ({ ...f, [k]: v }));
  const types = [
    { id: 'kitchen', label: 'Cloud / central kitchen', icon: ChefHat },
    { id: 'club', label: 'Club, academy or team', icon: Trophy },
    { id: 'therapist', label: 'Therapist or nutritionist', icon: HeartHandshake },
    { id: 'venue', label: 'Gym or venue operator', icon: Landmark },
    { id: 'sponsor', label: 'Sponsor or grant body', icon: HandCoins },
  ];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canNext = step === 0 ? !!form.type : step === 1 ? form.org.trim() && form.contact.trim() && emailOk : form.consent;
  const steps = ['Partner type', 'Details', 'Review & send'];

  function submit() {
    const id = `PN-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setRef(id);
  }

  function reset() {
    setForm({ type: '', org: '', contact: '', email: '', size: '1–10', message: '', consent: false });
    setStep(0);
    setRef(null);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <SectionHeader
        eyebrow="For partners"
        title="Partner with ActiveNutri."
        sub="Kitchens, clubs, therapists, venues and sponsors: tell us about yourself in three quick steps. A partnerships lead replies within two working days."
      />
      <Card className="mx-auto max-w-2xl">
        <ol className="mb-6 grid grid-cols-3 gap-2">
          {steps.map((s, i) => (
            <li key={s} className="text-[12px]">
              <div className={cx('mb-1.5 h-1 rounded-full', i <= (ref ? 3 : step) ? 'bg-pulse' : 'bg-black/10')} />
              <span className={cx(i === step && !ref ? 'font-semibold text-ink' : 'text-muted')}>
                {i + 1}. {s}
              </span>
            </li>
          ))}
        </ol>

        {ref ? (
          <div className="anim-rise py-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pulse-soft text-pulse">
              <Check />
            </span>
            <h3 className="headline mt-4 text-[24px] font-bold">Inquiry received</h3>
            <p className="mt-1 text-[14px] text-muted">
              Reference <span className="font-semibold text-ink tabular-nums">{ref}</span>. In this demo your inquiry stays in this browser tab; nothing is sent or stored.
            </p>
            <Button variant="secondary" className="mt-5" onClick={reset}>
              Start another
            </Button>
          </div>
        ) : step === 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => set('type', t.id)}
                aria-pressed={form.type === t.id}
                className={cx('flex items-center gap-3 rounded-2xl border p-4 text-left text-[14px] font-medium transition', form.type === t.id ? 'border-pulse bg-pulse-soft' : 'border-hair hover:border-ink/30')}
              >
                <t.icon size={20} /> {t.label}
              </button>
            ))}
          </div>
        ) : step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Organisation">
              <input className={inputCls} value={form.org} onChange={(e) => set('org', e.target.value)} placeholder="e.g. Bishan Shuttlers" />
            </Field>
            <Field label="Contact name">
              <input className={inputCls} value={form.contact} onChange={(e) => set('contact', e.target.value)} />
            </Field>
            <Field label="Work email" hint={form.email && !emailOk ? 'Enter a valid email address' : undefined}>
              <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Athletes / staff">
              <select className={inputCls} value={form.size} onChange={(e) => set('size', e.target.value)}>
                {['1–10', '11–50', '51–200', '200+'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="What would you like to explore? (optional)">
                <textarea className={cx(inputCls, 'h-24 py-2.5')} value={form.message} onChange={(e) => set('message', e.target.value)} />
              </Field>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <dl className="grid gap-3 rounded-2xl bg-canvas p-4 text-[14px] sm:grid-cols-2">
              <div>
                <dt className="text-[12px] text-muted">Partner type</dt>
                <dd className="font-semibold">{types.find((t) => t.id === form.type)?.label}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Organisation</dt>
                <dd className="font-semibold">{form.org}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Contact</dt>
                <dd className="font-semibold">
                  {form.contact} · {form.email}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Size</dt>
                <dd className="font-semibold">{form.size}</dd>
              </div>
              {form.message && (
                <div className="sm:col-span-2">
                  <dt className="text-[12px] text-muted">Message</dt>
                  <dd>{form.message}</dd>
                </div>
              )}
            </dl>
            <label className="flex items-start gap-2 text-[13px] text-muted">
              <input type="checkbox" className="mt-0.5 accent-pulse" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />I consent to ActiveNutri using these details to respond to this inquiry, in line with the PDPA.
            </label>
          </div>
        )}

        {!ref && (
          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ArrowLeft size={16} /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={submit} disabled={!canNext}>
                Send inquiry
              </Button>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}

export function Partners() {
  return <InquiryPipeline />;
}
