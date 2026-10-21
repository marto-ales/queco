"use client";

import { useState, useTransition } from "react";
import {
  addMeal,
  removeMeal,
  setServings,
  autoGenerateWeek,
  clearWeek,
} from "@/actions/planner";
import { RecipePicker } from "./recipe-picker";
import type { PlannedMealFull, RecipeListItem } from "@/lib/types";

const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type PickerTarget = { day: number; mealType: "almuerzo" | "cena" } | null;

type Props = {
  weekStart: string;
  meals: PlannedMealFull[];
  recipes: RecipeListItem[];
};

export function WeekGrid({ weekStart, meals, recipes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [showGen, setShowGen] = useState(false);

  const mealAt = (day: number, type: "almuerzo" | "cena") =>
    meals.find((m) => m.day_of_week === day && m.meal_type === type);

  const handlePick = (recipeId: number) => {
    if (!picker) return;
    const { day, mealType } = picker;
    startTransition(async () => {
      await addMeal(weekStart, day, mealType, recipeId);
      setPicker(null);
    });
  };

  const handleRemove = (mealId: number) => {
    startTransition(async () => {
      await removeMeal(weekStart, mealId);
    });
  };

  const handleServings = (mealId: number, delta: number, current: number) => {
    startTransition(async () => {
      await setServings(weekStart, mealId, current + delta);
    });
  };

  const handleGenerate = (days: number) => {
    if (meals.length > 0 && !confirm(`Se reemplazarán las ${meals.length} comidas de la semana. ¿Continuar?`)) {
      setShowGen(false);
      return;
    }
    setShowGen(false);
    startTransition(async () => {
      await autoGenerateWeek(weekStart, days);
    });
  };

  const handleClear = () => {
    if (meals.length === 0) return;
    if (!confirm("¿Vaciar toda la semana?")) return;
    startTransition(async () => {
      await clearWeek(weekStart);
    });
  };

  const filled = meals.length;
  const total = 14;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowGen((v) => !v)}
            disabled={isPending}
            className="btn-primary disabled:opacity-50"
          >
            🎲 Auto-generar
          </button>
          {showGen && (
            <div className="absolute left-0 top-full mt-2 z-30 card p-3 shadow-lg w-56">
              <p className="text-xs font-medium text-zinc-500 mb-2">¿Cuántos días querés planificar?</p>
              <div className="flex gap-2">
                {[3, 5, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleGenerate(d)}
                    disabled={isPending}
                    className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 disabled:opacity-50"
                  >
                    {d} días
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowGen(false)}
                className="w-full mt-2 text-xs text-zinc-400 hover:text-zinc-600"
              >
                cancelar
              </button>
            </div>
          )}
        </div>

        {filled > 0 && (
          <button onClick={handleClear} disabled={isPending} className="btn-danger disabled:opacity-50">
            🗑 Vaciar
          </button>
        )}

        <span className="text-sm text-zinc-400 ml-auto">
          {filled}/{total} comidas
        </span>
      </div>

      {/* Grid */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <div
            key={day}
            className="card p-3 flex flex-col md:grid md:grid-cols-[90px_1fr_1fr] md:gap-3 gap-2"
          >
            <div className="flex items-center justify-between md:block">
              <span className="font-medium text-sm">{DAY_NAMES[day]}</span>
              <span className="md:hidden text-xs text-zinc-400">{DAY_SHORT[day]}</span>
            </div>

            {(["almuerzo", "cena"] as const).map((mealType) => {
              const meal = mealAt(day, mealType);
              return meal ? (
                <div
                  key={mealType}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setPicker({ day, mealType })}
                      disabled={isPending}
                      className="flex-1 min-w-0 text-left disabled:opacity-50"
                      title="Cambiar receta"
                    >
                      <span className="text-lg mr-1.5">{meal.recipe_emoji || "🍽"}</span>
                      <span className="text-sm font-medium">{meal.recipe_name || "Sin receta"}</span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {mealType === "almuerzo" ? "🍽" : "🌙"}{" "}
                        {meal.recipe_time ? `⏱ ${meal.recipe_time} min` : ""}
                      </p>
                    </button>
                    <button
                      onClick={() => handleRemove(meal.id)}
                      disabled={isPending}
                      className="text-zinc-300 hover:text-red-500 text-sm shrink-0 disabled:opacity-50"
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-zinc-400">Porciones:</span>
                    <button
                      onClick={() => handleServings(meal.id, -1, meal.servings)}
                      disabled={isPending || meal.servings <= 1}
                      className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="text-xs font-medium w-4 text-center">{meal.servings}</span>
                    <button
                      onClick={() => handleServings(meal.id, 1, meal.servings)}
                      disabled={isPending || meal.servings >= 20}
                      className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  key={mealType}
                  onClick={() => setPicker({ day, mealType })}
                  disabled={isPending}
                  className="rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-2.5 text-sm text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors disabled:opacity-50 min-h-[58px]"
                >
                  + {mealType === "almuerzo" ? "Almuerzo" : "Cena"}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {picker && (
        <RecipePicker
          key={`${picker.day}-${picker.mealType}`}
          dayLabel={DAY_NAMES[picker.day]}
          mealType={picker.mealType}
          recipes={recipes}
          onPick={handlePick}
          onClose={() => setPicker(null)}
          pending={isPending}
        />
      )}
    </div>
  );
}
