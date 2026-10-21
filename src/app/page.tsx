import Link from "next/link";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { getRecipeCount, getExpressRecipes } from "@/lib/recipes";

export const instant = false;

export default function DashboardPage() {
  const db = getDb();
  seedDatabase();

  const recipeCount = getRecipeCount();
  const expressRecipes = getExpressRecipes();
  const expressPreview = expressRecipes.slice(0, 4);

  // Check for active week plan
  const activePlan = db
    .prepare("SELECT * FROM week_plans WHERE status = 'active' ORDER BY week_start DESC LIMIT 1")
    .get() as { id: number; week_start: string } | undefined;

  // Get current week meals if plan exists
  let currentMeals: {
    day_of_week: number;
    meal_type: string;
    recipe_name: string | null;
    recipe_emoji: string | null;
  }[] = [];
  if (activePlan) {
    currentMeals = db
      .prepare(`
        SELECT pm.day_of_week, pm.meal_type, r.name as recipe_name, r.image_emoji as recipe_emoji
        FROM planned_meals pm
        LEFT JOIN recipes r ON r.id = pm.recipe_id
        WHERE pm.week_plan_id = ?
        ORDER BY pm.day_of_week, pm.meal_type
      `)
      .all(activePlan.id) as typeof currentMeals;
  }

  const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">¿Qué cocinamos? 🍳</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Planificá una vez, cociná tranquilo toda la semana.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card card-hover p-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 text-xl ring-1 ring-emerald-500/15">
            📖
          </span>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{recipeCount}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Recetas</p>
          </div>
        </div>
        <div className="card card-hover p-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 text-xl ring-1 ring-sky-500/15">
            📅
          </span>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activePlan ? "✓" : "—"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Semana activa</p>
          </div>
        </div>
        <div className="card card-hover p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-xl ring-1 ring-amber-500/15">
            🚀
          </span>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{expressRecipes.length > 0 ? expressRecipes.length : "—"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Recetas express</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 md:p-7 text-white shadow-xl shadow-emerald-600/25">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-amber-300/20 blur-2xl" />
        <h2 className="relative font-semibold text-lg mb-1">Armá tu semana</h2>
        <p className="relative text-sm text-emerald-50/90 mb-5 max-w-md">
          Sentate 20 minutos, elegí los platos de cada día y listo. La lista de compras y el prep se generan solos.
        </p>
        <div className="relative flex flex-wrap gap-3">
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 active:scale-[0.97]"
          >
            📅 Ir al planificador
          </Link>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:bg-white/20 active:scale-[0.97]"
          >
            📖 Ver recetas
          </Link>
        </div>
      </div>

      {/* Current week overview */}
      {activePlan && currentMeals.length > 0 ? (
        <div>
          <h2 className="font-semibold text-lg mb-3">Tu semana</h2>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const dayMeals = currentMeals.filter((m) => m.day_of_week === day);
              if (dayMeals.length === 0) return null;
              return (
                <div key={day} className="card p-3 md:p-4">
                  <p className="font-medium text-sm mb-2">{DAY_NAMES[day]}</p>
                  <div className="space-y-1">
                    {dayMeals.map((meal, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-zinc-400 w-16 shrink-0">
                          {meal.meal_type === "almuerzo" ? "🍽 Almuerzo" : "🌙 Cena"}
                        </span>
                        <span>
                          {meal.recipe_emoji} {meal.recipe_name || "Sin asignar"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Link href="/shopping" className="btn-secondary">
              🛒 Ver lista de compras
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-5 md:p-6 text-center">
          <p className="text-4xl mb-3">📅</p>
          <h2 className="font-semibold text-lg mb-1">Tu semana está en blanco</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Armá tu primera semana en menos de 20 minutos.
          </p>
          <Link href="/planner" className="btn-primary">
            Empezar a planificar
          </Link>
        </div>
      )}

      {/* Express recipes */}
      {expressRecipes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Cenas express 🚀</h2>
            <Link href="/express" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {expressPreview.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="card card-hover p-3"
              >
                <span className="text-2xl">{recipe.image_emoji}</span>
                <p className="text-sm font-medium mt-2 line-clamp-2">{recipe.name}</p>
                <p className="text-xs text-zinc-400 mt-1">{recipe.time_minutes} min</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
