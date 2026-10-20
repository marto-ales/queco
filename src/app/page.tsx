import Link from "next/link";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { getRecipeCount, getExpressRecipes } from "@/lib/recipes";

export const instant = false;

export default function DashboardPage() {
  const db = getDb();
  seedDatabase();

  const recipeCount = getRecipeCount();
  const expressRecipes = getExpressRecipes().slice(0, 4);

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
        <div className="card p-4">
          <p className="text-2xl font-bold text-emerald-600">{recipeCount}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Recetas</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-emerald-600">{activePlan ? "✓" : "—"}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Semana activa</p>
        </div>
        <div className="card p-4 col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-emerald-600">{expressRecipes.length > 0 ? "🚀" : "—"}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Recetas express</p>
        </div>
      </div>

      {/* CTA */}
      <div className="card p-5 md:p-6">
        <h2 className="font-semibold text-lg mb-1">Armá tu semana</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Sentate 20 minutos, elegí los platos de cada día y listo. La lista de compras y el prep se generan solos.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/planner" className="btn-primary">
            📅 Ir al planificador
          </Link>
          <Link href="/recipes" className="btn-secondary">
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
            {expressRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="card p-3 hover:shadow-md transition-shadow"
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
