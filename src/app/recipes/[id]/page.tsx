import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeById, scaleIngredients } from "@/lib/recipes";

export const instant = false;

const PREP_BADGE: Record<string, string> = {
  express: "badge-express",
  normal: "badge-normal",
  largo: "badge-largo",
};

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servings?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const recipeId = parseInt(id, 10);

  if (isNaN(recipeId)) notFound();

  const recipe = getRecipeById(recipeId);
  if (!recipe) notFound();

  const targetServings = sp.servings ? parseInt(sp.servings, 10) : recipe.servings_base;
  const scaled = scaleIngredients(recipe.ingredients, recipe.servings_base, targetServings);
  const tags: string[] = JSON.parse(recipe.tags);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start gap-4">
          <span className="text-5xl">{recipe.image_emoji || "🍽"}</span>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{recipe.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`badge ${PREP_BADGE[recipe.prep_level]}`}>
                {recipe.prep_level}
              </span>
              <span className="text-sm text-zinc-500">⏱ {recipe.time_minutes} min</span>
              <span className="text-sm text-zinc-500 capitalize">
                {recipe.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`badge ${
                    tag === "vegetariano" || tag === "vegano-opcional"
                      ? "badge-veg"
                      : tag === "carne"
                        ? "badge-carne"
                        : tag === "pollo"
                          ? "badge-pollo"
                          : tag === "pescado"
                            ? "badge-pescado"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Servings adjuster */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Porciones</p>
            <p className="text-xs text-zinc-500">
              Receta base: {recipe.servings_base} porciones
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/recipes/${recipe.id}?servings=${Math.max(1, targetServings - 1)}`}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-lg"
            >
              −
            </a>
            <span className="font-bold text-lg w-8 text-center">{targetServings}</span>
            <a
              href={`/recipes/${recipe.id}?servings=${targetServings + 1}`}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-lg"
            >
              +
            </a>
          </div>
        </div>
        {targetServings !== recipe.servings_base && (
          <p className="text-xs text-emerald-600 mt-2">
            Ingredientes ajustados ×{(targetServings / recipe.servings_base).toFixed(1)}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Ingredients */}
        <div className="card p-5">
          <h2 className="font-semibold text-lg mb-4">🛒 Ingredientes</h2>
          <ul className="space-y-2.5">
            {scaled.map(({ ingredient, scaledQuantity }) => (
              <li
                key={ingredient.id}
                className="flex items-start justify-between gap-3 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0"
              >
                <div>
                  <span className="font-medium">{ingredient.ingredient_name}</span>
                  {ingredient.notes && (
                    <span className="text-zinc-400 text-xs ml-1">({ingredient.notes})</span>
                  )}
                </div>
                <span className="text-zinc-500 whitespace-nowrap font-mono text-xs">
                  {scaledQuantity} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="card p-5">
          <h2 className="font-semibold text-lg mb-4">👨‍🍳 Preparación</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.id} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {step.step_order}
                </span>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{step.instruction}</p>
                  {step.time_minutes && (
                    <p className="text-xs text-zinc-400 mt-1">⏱ ~{step.time_minutes} min</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {recipe.notes && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <p className="text-sm text-amber-800 dark:text-amber-300">💡 {recipe.notes}</p>
        </div>
      )}

      <Link href="/recipes" className="btn-secondary inline-flex">
        ← Volver al recetario
      </Link>
    </div>
  );
}
