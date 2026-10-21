"use client";

import { useState, useMemo } from "react";
import type { RecipeListItem } from "@/lib/types";

const PREP_BADGE: Record<string, string> = {
  express: "badge-express",
  normal: "badge-normal",
  largo: "badge-largo",
};

type Props = {
  dayLabel: string;
  mealType: "almuerzo" | "cena";
  recipes: RecipeListItem[];
  onPick: (recipeId: number) => void;
  onClose: () => void;
  pending: boolean;
};

export function RecipePicker({ dayLabel, mealType, recipes, onPick, onClose, pending }: Props) {
  const [search, setSearch] = useState("");
  const [onlySuggested, setOnlySuggested] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const suggestedCategory = mealType === "almuerzo" ? ["almuerzo", "snack"] : ["cena", "almuerzo"];
    return recipes.filter((r) => {
      if (onlySuggested && !suggestedCategory.includes(r.category)) return false;
      if (!q) return true;
      if (r.name.toLowerCase().includes(q)) return true;
      // match against tags
      return JSON.parse(r.tags).some((t: string) => t.includes(q));
    });
  }, [recipes, search, onlySuggested, mealType]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full md:max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl md:rounded-3xl border border-white/60 bg-white/85 backdrop-blur-2xl shadow-2xl dark:border-white/10 dark:bg-zinc-900/85 animate-[pop-in_.25s_cubic-bezier(.22,.68,.32,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/60 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              {dayLabel} · {mealType === "almuerzo" ? "🍽 Almuerzo" : "🌙 Cena"}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100/80 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/80 dark:hover:bg-white/20 transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar receta..."
            className="input"
            autoFocus
          />
          <label className="flex items-center gap-2 mt-2.5 text-xs text-zinc-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlySuggested}
              onChange={(e) => setOnlySuggested(e.target.checked)}
              className="rounded"
            />
            {mealType === "almuerzo" ? "Solo sugeridas para almuerzo" : "Solo sugeridas para cena"}
          </label>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">Sin resultados</p>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => onPick(r.id)}
                disabled={pending}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/80 dark:hover:bg-white/5 text-left transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">{r.image_emoji || "🍽"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-zinc-400">
                    ⏱ {r.time_minutes} min · {r.servings_base} porc.
                  </p>
                </div>
                <span className={`badge ${PREP_BADGE[r.prep_level]}`}>{r.prep_level}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
