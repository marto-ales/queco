import { getDb } from "./db";
import type { PrepTask, PrepTaskFull, PrepLevel } from "./types";

type AggregatedRecipe = {
  id: number;
  name: string;
  prep_level: PrepLevel;
  time_minutes: number;
  times: number;
  total_servings: number;
};

function prepTime(time: number): number {
  return Math.max(5, Math.round(time * 0.35));
}

/**
 * Rebuilds the week's prep tasks from its planned meals. Each recipe yields
 * three tasks (one per prep level), aggregated across all planned servings.
 * Keeps the completed state of tasks that remain.
 */
export function syncPrepTasks(weekStart: string): {
  tasks: PrepTaskFull[];
  hasMeals: boolean;
} {
  const db = getDb();

  const plan = db.prepare("SELECT id FROM week_plans WHERE week_start = ?").get(weekStart) as
    | { id: number }
    | undefined;

  if (!plan) return { tasks: [], hasMeals: false };

  const recipes = db
    .prepare(`
      SELECT r.id, r.name, r.prep_level, r.time_minutes,
        COUNT(pm.id) as times,
        SUM(pm.servings) as total_servings
      FROM planned_meals pm
      JOIN recipes r ON r.id = pm.recipe_id
      WHERE pm.week_plan_id = ? AND pm.recipe_id IS NOT NULL
      GROUP BY r.id
      ORDER BY r.name
    `)
    .all(plan.id) as AggregatedRecipe[];

  if (recipes.length === 0) {
    db.prepare("DELETE FROM prep_tasks WHERE week_plan_id = ?").run(plan.id);
    return { tasks: [], hasMeals: false };
  }

  const existing = db.prepare("SELECT * FROM prep_tasks WHERE week_plan_id = ?").all(plan.id) as PrepTask[];
  const completedByKey = new Map(existing.map((t) => [`${t.recipe_id}:${t.level}`, t.completed]));

  const tasks: Omit<PrepTask, "id" | "week_plan_id">[] = [];
  for (const level of [1, 2, 3] as const) {
    for (const r of recipes) {
      let description: string;
      let minutes: number;

      if (level === 1) {
        description = `Lavar, cortar y dejar listos los ingredientes de ${r.name}`;
        minutes = prepTime(r.time_minutes);
      } else if (level === 2) {
        description =
          r.times > 1
            ? `Cocinar ${r.name} en lote (${r.times} comidas)`
            : `Cocinar ${r.name}`;
        minutes = r.time_minutes;
      } else {
        description = `Porcionar ${r.total_servings} ${
          r.total_servings === 1 ? "vianda" : "viandas"
        } de ${r.name}`;
        minutes = r.total_servings * 2;
      }

      tasks.push({
        recipe_id: r.id,
        level,
        task_description: description,
        time_minutes: minutes,
        sort_order: tasks.length,
        completed: completedByKey.get(`${r.id}:${level}`) ?? 0,
      });
    }
  }

  db.transaction(() => {
    db.prepare("DELETE FROM prep_tasks WHERE week_plan_id = ?").run(plan.id);
    const insert = db.prepare(
      "INSERT INTO prep_tasks (week_plan_id, recipe_id, level, task_description, time_minutes, sort_order, completed) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    for (const t of tasks) {
      insert.run(
        plan.id,
        t.recipe_id,
        t.level,
        t.task_description,
        t.time_minutes,
        t.sort_order,
        t.completed
      );
    }
  })();

  const result = db
    .prepare(`
      SELECT pt.*, r.name as recipe_name, r.image_emoji as recipe_emoji
      FROM prep_tasks pt
      JOIN recipes r ON r.id = pt.recipe_id
      WHERE pt.week_plan_id = ?
      ORDER BY pt.sort_order
    `)
    .all(plan.id) as PrepTaskFull[];

  return { tasks: result, hasMeals: true };
}
