import Link from "next/link";
import { getAllRecipes } from "@/lib/recipes";
import type { RecipeCategory, PrepLevel } from "@/lib/types";

export const instant = false;

const CATEGORY_LABELS: Record<string, string> = {
  almuerzo: "🍽 Almuerzo",
  cena: "🌙 Cena",
  desayuno: "🌅 Desayuno",
  snack: "🥜 Snack",
  postre: "🍰 Postre",
};

const PREP_BADGE: Record<string, string> = {
  express: "badge-express",
  normal: "badge-normal",
  largo: "badge-largo",
};

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; prep?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const category = sp.category as RecipeCategory | undefined;
  const prepLevel = sp.prep as PrepLevel | undefined;
  const search = sp.q || undefined;

  const recipes = getAllRecipes({ category, prepLevel, search });

  const categories = ["almuerzo", "cena", "desayuno", "snack", "postre"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recetario 📖</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {recipes.length} recetas · Buscá por nombre o ingrediente.
          </p>
        </div>
        <Link href="/recipes/new" className="btn-primary shrink-0">
          ➕ Nueva
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-2" action="/recipes" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={search || ""}
          placeholder="Buscar receta o ingrediente..."
          className="input flex-1"
        />
        {category && <input type="hidden" name="category" value={category} />}
        {prepLevel && <input type="hidden" name="prep" value={prepLevel} />}
        <button type="submit" className="btn-primary">🔍</button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/recipes"
          className={`badge ${!category ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
        >
          Todas
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/recipes?category=${cat}${search ? `&q=${search}` : ""}`}
            className={`badge ${category === cat ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
        <span className="w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
        {(["express", "normal", "largo"] as const).map((level) => (
          <Link
            key={level}
            href={`/recipes?prep=${level}${category ? `&category=${category}` : ""}${search ? `&q=${search}` : ""}`}
            className={`badge ${prepLevel === level ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          >
            {level === "express" ? "🚀 Express" : level === "normal" ? "⏱ Normal" : "🐢 Largo"}
          </Link>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recipes.length === 0 ? (
          <div className="card p-8 text-center col-span-full">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-medium">No se encontraron recetas</p>
            <p className="text-sm text-zinc-500 mt-1">Probá con otros filtros o términos.</p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="card p-4 hover:shadow-md transition-shadow flex items-start gap-3"
            >
              <span className="text-3xl mt-0.5">{recipe.image_emoji || "🍽"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{recipe.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-zinc-400">{recipe.time_minutes} min</span>
                  <span className="text-xs text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="text-xs text-zinc-400">{recipe.servings_base} porc.</span>
                  <span className={`badge ${PREP_BADGE[recipe.prep_level]}`}>
                    {recipe.prep_level}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {JSON.parse(recipe.tags)
                    .slice(0, 3)
                    .map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
