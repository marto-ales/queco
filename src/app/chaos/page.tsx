import { CHAOS_BASE, CHAOS_MEALS } from "@/lib/chaos-data";

export const instant = false;

export default function ChaosPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 p-5 md:p-7 text-white shadow-xl shadow-rose-600/25">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-amber-300/25 blur-2xl" />
        <h1 className="relative text-2xl md:text-3xl font-bold">Modo Caos 🆘</h1>
        <p className="relative text-sm text-rose-50/95 mt-1 max-w-lg">
          Se te fue la semana. Una sesión de prep de ~60 min y salen{" "}
          <strong>{CHAOS_MEALS.length} platos distintos</strong> combinando la misma base.
        </p>
      </div>

      {/* Steps header */}
      <div className="grid gap-3 md:grid-cols-[220px_1fr] items-start">
        {/* Base */}
        <div className="card p-4 md:sticky md:top-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400/20 to-orange-500/20 text-base ring-1 ring-rose-500/15">
              🧺
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Base de prep</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Comprá y cociná esto primero
              </p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {CHAOS_BASE.map((item) => (
              <li key={item.ingredient} className="rounded-2xl bg-white/60 dark:bg-white/5 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">{item.ingredient}</span>
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  {item.prep}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Meals */}
        <div className="space-y-3">
          <div className="card p-4">
            <h2 className="text-sm font-semibold">¿Cómo funciona?</h2>
            <div className="mt-2 grid gap-2 text-[13px] text-zinc-600 dark:text-zinc-300 sm:grid-cols-3">
              <p className="rounded-2xl bg-white/60 dark:bg-white/5 p-2.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400">1.</span> Dedicá ~60
                min a la base.
              </p>
              <p className="rounded-2xl bg-white/60 dark:bg-white/5 p-2.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400">2.</span> Elegí el
                plato del día de la lista.
              </p>
              <p className="rounded-2xl bg-white/60 dark:bg-white/5 p-2.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400">3.</span> Sumá los
                extras que tengas a mano.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">🍽 Platos que salen de la base</h2>
            <span className="badge badge-carne">{CHAOS_MEALS.length}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CHAOS_MEALS.map((meal) => (
              <div key={meal.name} className="card p-4">
                <p className="flex items-center gap-2 font-medium">
                  <span className="text-2xl">{meal.emoji}</span>
                  {meal.name}
                </p>
                <div className="mt-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1">
                    De la base
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {meal.needs.map((n) => (
                      <span
                        key={n}
                        className="rounded-full bg-emerald-100/80 dark:bg-emerald-950/70 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-500/20"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                {meal.extra.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1">Extras</p>
                    <div className="flex flex-wrap gap-1">
                      {meal.extra.map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-zinc-100/80 dark:bg-white/10 px-2 py-0.5 text-[11px] text-zinc-500 dark:text-zinc-400"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
