import Link from "next/link";
import { connection } from "next/server";
import { mondayOf, shiftWeek, weekLabel, isCurrentWeek } from "@/lib/planner";
import { syncShoppingList } from "@/lib/shopping";
import { ShoppingList } from "@/components/shopping/shopping-list";

export const instant = false;

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  await connection();

  const weekStart = mondayOf(sp.week);
  const { items, hasMeals } = syncShoppingList(weekStart);

  const prev = shiftWeek(weekStart, -1);
  const next = shiftWeek(weekStart, 1);
  const current = isCurrentWeek(weekStart);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lista de compras 🛒</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Generada automáticamente desde tu plan semanal.
        </p>
      </div>

      {/* Week navigation */}
      <div className="card p-3 flex items-center justify-between gap-2 no-print">
        <Link
          href={`/shopping?week=${prev}`}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100/80 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 font-bold shrink-0 transition-colors"
          aria-label="Semana anterior"
        >
          ‹
        </Link>
        <div className="text-center min-w-0">
          <p className="font-medium text-sm md:text-base truncate">{weekLabel(weekStart)}</p>
          {!current && (
            <Link href="/shopping" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              ← Volver a esta semana
            </Link>
          )}
        </div>
        <Link
          href={`/shopping?week=${next}`}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100/80 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 font-bold shrink-0 transition-colors"
          aria-label="Semana siguiente"
        >
          ›
        </Link>
      </div>

      {hasMeals ? (
        <>
          <div className="hidden print:block text-sm text-zinc-500">
            {weekLabel(weekStart)} · QueCo
          </div>
          <ShoppingList weekStart={weekStart} items={items} />
        </>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">🧺</p>
          <h2 className="font-semibold text-lg mb-1">Todavía no hay nada para comprar</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-sm mx-auto">
            Planificá comidas para esta semana y la lista se arma sola con las cantidades exactas.
          </p>
          <Link href={`/planner?week=${weekStart}`} className="btn-primary">
            📅 Planificar esta semana
          </Link>
        </div>
      )}
    </div>
  );
}
