const notes = [
  {
    title: 'Health Promotion Board (HPB)',
    body: 'Meal macros follow HPB “My Healthy Plate” proportions and the Healthier Choice Symbol guidance. Beverages sold in pods meet Nutri-Grade A or B; recovery targets are general guidance, not medical advice.',
  },
  {
    title: 'Singapore Food Agency (SFA)',
    body: 'All partner central and cloud kitchens hold SFA food-shop licences with Grade-A hygiene. Cold-chain meals are held at ≤5°C and hot-held meals at ≥60°C in line with SFA food-safety requirements.',
  },
  {
    title: 'ActiveSG',
    body: 'Court reservations made by the booking bot respect ActiveSG fair-use rules: one active slot per sport per member per day, released slots only, no resale. Always confirm on the ActiveSG app.',
  },
  {
    title: 'PDPA',
    body: 'Profile, training and biometric data stay in your browser session in this demo. Nothing is stored server-side, and no partner credentials ever reach your device.',
  },
];

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="eyebrow mb-4">Compliance &amp; integration notes</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {notes.map((n) => (
            <div key={n.title}>
              <h4 className="text-[13px] font-semibold">{n.title}</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{n.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-black/5 pt-5 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 ActiveNutri · Integrations: ActiveSG, OneMap SG, SFA cloud kitchens.
          </p>
        </div>
      </div>
    </footer>
  );
}
