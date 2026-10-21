import Link from "next/link";
import { connection } from "next/server";
import { getRecipesByCategories } from "@/lib/recipes";

export const instant = false;

const ROLE_LABELS: Record<string, string> = {
  desayuno: "Base",
  snack: "Snack",
  postre: "Postre",
};

const ROLE_EMOJI: Record<string, string> = {
  desayuno: "🥣",
  snack: "🥜",
  postre: "🍰",
};

export default async function BreakfastPage() {
  await connection();

  const recipes = getRecipesByCategories(["desayuno", "snack", "postre"]);

  const groups = [
    {
      role: "base" as const,
      title: "Bases",
      subtitle: "Elegí una por día",
      items: recipes.filter((r) => r.category === "desayuno"),
    },
    {
      role: "extra" as const,
      title: "Snacks y postres",
      subtitle: "Para completar el día",
      items: recipes.filter((r) => r.category !== "desayuno"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500 p-5 md:p-7 text-white shadow-xl shadow-sky-600/25">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <h1 className="relative text-2xl md:text-3xl font-bold">Desayunos 🥣</h1>
        <p className="relative text-sm text-sky-50/95 mt-1 max-w-lg">
          Mix & Match: armá tus mañanas combinando una base con un snack o postre. Tocá los que te
          gusten.
        </p>
      </div>

      {/* Builder */}
      <div className="grid gap-3 md:grid-cols-[200px_1fr] items-start">
        <div className="card p-4 md:sticky md:top-4">
          <p className="flex items-center gap-2 text-sm font-semibold mb-2">
            <span className="text-lg">🎛</span> Cómo usarlo
          </p>
          <ul className="space-y-2 text-[13px] text-zinc-600 dark:text-zinc-300">
            <li className="rounded-2xl bg-white/60 dark:bg-white/5 p-2.5">
              Elegí <strong>una base</strong> para cada mañana.
            </li>
            <li className="rounded-2xl bg-white/60 dark:bg-white/5 p-2.5">
              Sumá <strong>1 snack o postre</strong> si querés algo más.
            </li>
            <li className="rounded-2xl bg-white/60 dark:bg-white/5 p-2.5">
              Agregá lo que elijas a tu <Link href="/shopping" className="text-sky-600 dark:text-sky-400 font-medium underline-offset-2 hover:underline">lista de compras</Link>.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.role}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-lg">
                  {ROLE_EMOJI[group.items[0]?.category || "desayuno"]} {group.title}
                </h2>
                <span className="badge badge-pescado">{group.items.length}</span>
                <span className="text-xs text-zinc-400">{group.subtitle}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="card card-hover p-4 flex items-start gap-3"
                  >
                    <span className="text-3xl mt-0.5">{recipe.image_emoji || "🍽"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recipe.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-zinc-400">⏱ {recipe.time_minutes} min</span>
                        <span className="badge badge-normal">
                          {ROLE_LABELS[recipe.category] || recipe.category}
                        </span>
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
                ))}
              </div>
            </div>
          ))}

          <div className="card p-4 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              ¿Falta variedad? Agregá tus propios desayunos y snacks.
            </p>
            <Link href="/recipes/new" className="btn-primary mt-3">
              ➕ Nueva receta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
