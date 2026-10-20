import { getDb } from "./db";
import type {
  Recipe,
  RecipeListItem,
  RecipeWithDetails,
  RecipeIngredientFull,
  RecipeStep,
  RecipeCategory,
  PrepLevel,
} from "./types";

export function getAllRecipes(filters?: {
  category?: RecipeCategory;
  prepLevel?: PrepLevel;
  search?: string;
}): RecipeListItem[] {
  const db = getDb();
  let sql = `
    SELECT r.*, (SELECT COUNT(*) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) as ingredient_count
    FROM recipes r WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.category) {
    sql += " AND r.category = ?";
    params.push(filters.category);
  }
  if (filters?.prepLevel) {
    sql += " AND r.prep_level = ?";
    params.push(filters.prepLevel);
  }
  if (filters?.search) {
    sql += " AND (r.name LIKE ? OR EXISTS (SELECT 1 FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = r.id AND i.name LIKE ?))";
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  sql += " ORDER BY r.name ASC";
  return db.prepare(sql).all(...params) as RecipeListItem[];
}

export function getRecipeById(id: number): RecipeWithDetails | null {
  const db = getDb();
  const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id) as Recipe | undefined;
  if (!recipe) return null;

  const ingredients = db
    .prepare(`
      SELECT ri.*, i.name as ingredient_name, s.name as section_name, s.sort_order as section_sort
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      JOIN supermarket_sections s ON s.id = i.section_id
      WHERE ri.recipe_id = ?
      ORDER BY s.sort_order, i.name
    `)
    .all(id) as RecipeIngredientFull[];

  const steps = db
    .prepare("SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order")
    .all(id) as RecipeStep[];

  return { ...recipe, ingredients, steps };
}

export function getExpressRecipes(): RecipeListItem[] {
  return getAllRecipes({ prepLevel: "express" });
}

export function getRecipeCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM recipes").get() as { c: number };
  return row.c;
}

export function getSuggestedRecipes(count: number, excludeIds: number[] = []): RecipeListItem[] {
  const db = getDb();
  const placeholders = excludeIds.map(() => "?").join(",");
  const excludeClause = excludeIds.length > 0 ? `AND r.id NOT IN (${placeholders})` : "";
  const sql = `
    SELECT r.*, (SELECT COUNT(*) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) as ingredient_count
    FROM recipes r
    WHERE r.category IN ('almuerzo', 'cena') ${excludeClause}
    ORDER BY RANDOM()
    LIMIT ?
  `;
  return db.prepare(sql).all(...excludeIds, count) as RecipeListItem[];
}

export function scaleIngredients(
  ingredients: RecipeIngredientFull[],
  baseServings: number,
  targetServings: number
): { ingredient: RecipeIngredientFull; scaledQuantity: number }[] {
  const factor = targetServings / baseServings;
  return ingredients.map((ing) => ({
    ingredient: ing,
    scaledQuantity: Math.round(ing.quantity * factor * 100) / 100,
  }));
}
