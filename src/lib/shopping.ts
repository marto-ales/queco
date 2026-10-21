import { getDb } from "./db";
import type { ShoppingItem, ShoppingItemFull, Unit } from "./types";

/**
 * Rebuilds the shopping list for a week from its planned meals, scaling each
 * recipe's ingredients by the planned servings. Keeps the checked state of
 * items that remain in the list.
 */
export function syncShoppingList(weekStart: string): {
  items: ShoppingItemFull[];
  hasPlan: boolean;
  hasMeals: boolean;
} {
  const db = getDb();

  const plan = db.prepare("SELECT id FROM week_plans WHERE week_start = ?").get(weekStart) as
    | { id: number }
    | undefined;

  if (!plan) return { items: [], hasPlan: false, hasMeals: false };

  const mealCount = (
    db.prepare("SELECT COUNT(*) as c FROM planned_meals WHERE week_plan_id = ?").get(plan.id) as {
      c: number;
    }
  ).c;

  if (mealCount === 0) {
    db.prepare("DELETE FROM shopping_items WHERE week_plan_id = ?").run(plan.id);
    return { items: [], hasPlan: true, hasMeals: false };
  }

  const aggregated = db
    .prepare(`
      SELECT ri.ingredient_id, ri.unit,
        SUM(ri.quantity * (pm.servings * 1.0 / MAX(r.servings_base, 1))) as quantity
      FROM planned_meals pm
      JOIN recipes r ON r.id = pm.recipe_id
      JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      WHERE pm.week_plan_id = ?
      GROUP BY ri.ingredient_id, ri.unit
    `)
    .all(plan.id) as { ingredient_id: number; unit: Unit; quantity: number }[];

  const existing = db
    .prepare("SELECT * FROM shopping_items WHERE week_plan_id = ?")
    .all(plan.id) as ShoppingItem[];
  const checkedByKey = new Map(existing.map((i) => [`${i.ingredient_id}:${i.unit}`, i.checked]));

  db.transaction(() => {
    db.prepare("DELETE FROM shopping_items WHERE week_plan_id = ?").run(plan.id);
    const insert = db.prepare(
      "INSERT INTO shopping_items (week_plan_id, ingredient_id, quantity, unit, checked) VALUES (?, ?, ?, ?, ?)"
    );
    for (const a of aggregated) {
      insert.run(
        plan.id,
        a.ingredient_id,
        a.quantity,
        a.unit,
        checkedByKey.get(`${a.ingredient_id}:${a.unit}`) ?? 0
      );
    }
  })();

  const items = db
    .prepare(`
      SELECT si.*, i.name as ingredient_name, s.name as section_name, s.sort_order as section_sort
      FROM shopping_items si
      JOIN ingredients i ON i.id = si.ingredient_id
      JOIN supermarket_sections s ON s.id = i.section_id
      WHERE si.week_plan_id = ?
      ORDER BY s.sort_order, i.name, si.unit
    `)
    .all(plan.id) as ShoppingItemFull[];

  return { items, hasPlan: true, hasMeals: true };
}
