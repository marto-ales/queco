"use server";

import { getDb } from "@/lib/db";
import { getWeekPlan } from "@/lib/planner";
import { revalidatePath } from "next/cache";

function ensureWeekPlan(weekStart: string): number {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM week_plans WHERE week_start = ?").get(weekStart) as
    | { id: number }
    | undefined;
  if (existing) return existing.id;
  const result = db.prepare("INSERT INTO week_plans (week_start) VALUES (?)").run(weekStart);
  return Number(result.lastInsertRowid);
}

function refresh(weekStart: string) {
  revalidatePath("/planner");
  revalidatePath(`/?week=${weekStart}`);
  revalidatePath("/");
  revalidatePath("/shopping");
  revalidatePath("/prep");
}

export async function addMeal(
  weekStart: string,
  day: number,
  mealType: "almuerzo" | "cena",
  recipeId: number
) {
  const db = getDb();
  const planId = ensureWeekPlan(weekStart);

  const recipe = db.prepare("SELECT id, servings_base FROM recipes WHERE id = ?").get(recipeId) as
    | { id: number; servings_base: number }
    | undefined;
  if (!recipe) return { error: "Receta no encontrada" };

  const existing = db
    .prepare(
      "SELECT id FROM planned_meals WHERE week_plan_id = ? AND day_of_week = ? AND meal_type = ?"
    )
    .get(planId, day, mealType) as { id: number } | undefined;

  if (existing) {
    db.prepare("UPDATE planned_meals SET recipe_id = ?, servings = ? WHERE id = ?").run(
      recipeId,
      recipe.servings_base,
      existing.id
    );
  } else {
    db.prepare(
      "INSERT INTO planned_meals (week_plan_id, day_of_week, meal_type, recipe_id, servings) VALUES (?, ?, ?, ?, ?)"
    ).run(planId, day, mealType, recipeId, recipe.servings_base);
  }

  refresh(weekStart);
  return { ok: true };
}

export async function removeMeal(weekStart: string, mealId: number) {
  const db = getDb();
  db.prepare("DELETE FROM planned_meals WHERE id = ?").run(mealId);
  refresh(weekStart);
  return { ok: true };
}

export async function setServings(weekStart: string, mealId: number, servings: number) {
  const clamped = Math.max(1, Math.min(20, Math.round(servings)));
  const db = getDb();
  db.prepare("UPDATE planned_meals SET servings = ? WHERE id = ?").run(clamped, mealId);
  refresh(weekStart);
  return { ok: true };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function autoGenerateWeek(weekStart: string, days: number) {
  const db = getDb();
  const planId = ensureWeekPlan(weekStart);

  const lunches = shuffle(
    db.prepare("SELECT id FROM recipes WHERE category IN ('almuerzo','snack')").all() as {
      id: number;
    }[]
  ).map((r) => r.id);
  const dinners = shuffle(
    db.prepare("SELECT id FROM recipes WHERE category IN ('cena','almuerzo')").all() as {
      id: number;
    }[]
  ).map((r) => r.id);

  if (lunches.length === 0 || dinners.length === 0) return { error: "No hay recetas cargadas" };

  db.transaction(() => {
    // Replace the full week's meals
    db.prepare("DELETE FROM planned_meals WHERE week_plan_id = ?").run(planId);

    const insert = db.prepare(
      "INSERT INTO planned_meals (week_plan_id, day_of_week, meal_type, recipe_id, servings) VALUES (?, ?, ?, ?, ?)"
    );

    const servingsOf = db.prepare("SELECT servings_base FROM recipes WHERE id = ?");

    for (let d = 1; d <= Math.min(days, 7); d++) {
      const lunchId = lunches[(d - 1) % lunches.length];
      const dinnerId = dinners[(d - 1) % dinners.length];
      const lunchServ = (servingsOf.get(lunchId) as { servings_base: number }).servings_base;
      const dinnerServ = (servingsOf.get(dinnerId) as { servings_base: number }).servings_base;
      insert.run(planId, d, "almuerzo", lunchId, lunchServ);
      insert.run(planId, d, "cena", dinnerId, dinnerServ);
    }
  })();

  refresh(weekStart);
  return { ok: true };
}

export async function clearWeek(weekStart: string) {
  const db = getDb();
  const plan = getWeekPlan(weekStart);
  if (plan) {
    db.prepare("DELETE FROM planned_meals WHERE week_plan_id = ?").run(plan.id);
    db.prepare("DELETE FROM shopping_items WHERE week_plan_id = ?").run(plan.id);
  }
  refresh(weekStart);
  return { ok: true };
}
