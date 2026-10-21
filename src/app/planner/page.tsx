import Link from "next/link";
import { connection } from "next/server";
import {
  mondayOf,
  shiftWeek,
  weekLabel,
  isCurrentWeek,
  getWeekPlan,
  getWeekMeals,
  getPickerRecipes,
} from "@/lib/planner";
import { WeekGrid } from "@/components/planner/week-grid";

export const instant = false;

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  await connection();
  const weekStart = mondayOf(sp.week);
  const plan = getWeekPlan(weekStart);
  const meals = plan ? getWeekMeals(plan.id) : [];
  const recipes = getPickerRecipes();

  const prev = shiftWeek(weekStart, -1);
  const next = shiftWeek(weekStart, 1);
  const current = isCurrentWeek(weekStart);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Planificador 📅</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Armá tu semana: elegí un plato por día y la lista de compras se arma sola.
        </p>
      </div>

      {/* Week navigation */}
      <div className="card p-3 flex items-center justify-between gap-2">
        <Link
          href={`/planner?week=${prev}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold shrink-0"
          aria-label="Semana anterior"
        >
          ‹
        </Link>
        <div className="text-center min-w-0">
          <p className="font-medium text-sm md:text-base truncate">{weekLabel(weekStart)}</p>
          {!current && (
            <Link
              href="/planner"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ← Volver a esta semana
            </Link>
          )}
        </div>
        <Link
          href={`/planner?week=${next}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold shrink-0"
          aria-label="Semana siguiente"
        >
          ›
        </Link>
      </div>

      {/* Grid */}
      <WeekGrid weekStart={weekStart} meals={meals} recipes={recipes} />

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/shopping?week=${weekStart}`} className="btn-secondary">
          🛒 Lista de compras
        </Link>
        <Link href="/prep" className="btn-secondary">
          ⚡ Meal prep
        </Link>
      </div>
    </div>
  );
}
