import { getDb } from "./db";
import type { WeekPlan, PlannedMealFull, RecipeListItem } from "./types";

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing dateStr (or current week if omitted). */
export function mondayOf(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  const dow = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - dow);
  return fmt(d);
}

/** Shift a YYYY-MM-DD week start by n weeks. */
export function shiftWeek(weekStart: string, weeks: number): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return fmt(d);
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "Del lun 20 al dom 26 de oct" */
export function weekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const s = `${start.getDate()} ${MONTHS[start.getMonth()]}`;
  const e =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${end.getDate()} ${MONTHS[end.getMonth()]}`;
  return `Del ${s} al ${e} de ${MONTHS[end.getMonth()]}`;
}

export function isCurrentWeek(weekStart: string): boolean {
  return mondayOf() === weekStart;
}

export function getWeekPlan(weekStart: string): WeekPlan | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM week_plans WHERE week_start = ?").get(weekStart) as WeekPlan) ?? null;
}

export function getWeekMeals(weekPlanId: number): PlannedMealFull[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT pm.*, r.name as recipe_name, r.image_emoji as recipe_emoji, r.time_minutes as recipe_time
      FROM planned_meals pm
      LEFT JOIN recipes r ON r.id = pm.recipe_id
      WHERE pm.week_plan_id = ?
      ORDER BY pm.day_of_week,
        CASE pm.meal_type WHEN 'almuerzo' THEN 0 ELSE 1 END
    `)
    .all(weekPlanId) as PlannedMealFull[];
}

/** Light recipe list for the picker. */
export function getPickerRecipes(): RecipeListItem[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT r.*, (SELECT COUNT(*) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) as ingredient_count
      FROM recipes r ORDER BY r.name
    `)
    .all() as RecipeListItem[];
}
