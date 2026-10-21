import Link from "next/link";
import { connection } from "next/server";
import { getAllRecipes } from "@/lib/recipes";
import type { RecipeListItem } from "@/lib/types";

export const instant = false;

const MAX_MINUTES = 20;

const PREP_BADGE: Record<string, string> = {
  express: "badge-express",
  normal: "badge-normal",
  largo: "badge-largo",
};

function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="card card-hover p-4 flex items-start gap-3">
      <span className="text-3xl mt-0.5">{recipe.image_emoji || "🍽"}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{recipe.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="badge badge-express">⏱ {recipe.time_minutes} min</span>
          <span className="text-xs text-zinc-400">{recipe.servings_base} porc.</span>
          <span className={`badge ${PREP_BADGE[recipe.prep_level]}`}>{recipe.prep_level}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {JSON.parse(recipe.tags)
            .slice(0, 3)
            .map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100/80 dark:bg-white/10 text-zinc-500 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
        </div>
      </div>
    </Link>
  );
}

export default async function ExpressPage({
  searchParams,
}: {
  searchParams: Promise<{ max?: string }>;
}) {
  const sp = await searchParams;
  await connection();

  const max = Math.max(5, Math.min(45, parseInt(sp.max || String(MAX_MINUTES), 10) || MAX_MINUTES));

  const express = getAllRecipes({ prepLevel: "express" }).filter((r) => r.time_minutes <= max);
  const others = getAllRecipes()
    .filter((r) => r.prep_level !== "express" && r.time_minutes <= max)
    .sort((a, b) => a.time_minutes - b.time_minutes);

  const mins = (
    <div className="flex flex-wrap gap-2">
      {[15, 20, 30].map((m) => (
        <Link
          key={m}
          href={`/express?max=${m}`}
          className={`badge ${max === m ? "bg-emerald-600 text-white" : "bg-zinc-100/80 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20"}`}
        >
          ≤ {m} min
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-5 md:p-7 text-white shadow-xl shadow-amber-600/25">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <h1 className="relative text-2xl md:text-3xl font-bold">Modo Express 🚀</h1>
        <p className="relative text-sm text-amber-50/95 mt-1 max-w-md">
          Sin tiempo y con hambre. Estas recetas salen en {max} minutos o menos.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {express.length + others.length} recetas listas para hoy
        </p>
        {mins}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-lg">⚡ Pensadas para express</h2>
          <span className="badge badge-express">{express.length}</span>
        </div>
        {express.length === 0 ? (
          <div className="card p-6 text-center text-sm text-zinc-500">
            No hay recetas express de {max} min o menos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {express.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold text-lg">🐢 También entran en {max} min</h2>
            <span className="badge badge-largo">{others.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {others.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
