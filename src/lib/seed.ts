import { getDb, isSeeded } from "./db";
import { SECTIONS, INGREDIENTS, RECIPES } from "./seed-data";

export function seedDatabase(): { sections: number; ingredients: number; recipes: number } {
  const db = getDb();

  if (isSeeded(db)) {
    const sections = (db.prepare("SELECT COUNT(*) as c FROM supermarket_sections").get() as { c: number }).c;
    const ingredients = (db.prepare("SELECT COUNT(*) as c FROM ingredients").get() as { c: number }).c;
    const recipes = (db.prepare("SELECT COUNT(*) as c FROM recipes").get() as { c: number }).c;
    return { sections, ingredients, recipes };
  }

  const insertSection = db.prepare("INSERT INTO supermarket_sections (name, sort_order) VALUES (?, ?)");
  const sectionMap = new Map<string, number>();

  const insertAllSections = db.transaction(() => {
    for (const s of SECTIONS) {
      const result = insertSection.run(s.name, s.sort_order);
      sectionMap.set(s.name, Number(result.lastInsertRowid));
    }
  });
  insertAllSections();

  const insertIngredient = db.prepare(
    "INSERT INTO ingredients (name, unit, section_id) VALUES (?, ?, ?)"
  );
  const ingredientMap = new Map<string, number>();

  const insertAllIngredients = db.transaction(() => {
    for (const ing of INGREDIENTS) {
      const sectionId = sectionMap.get(ing.section);
      if (!sectionId) continue;
      try {
        const result = insertIngredient.run(ing.name, ing.unit, sectionId);
        ingredientMap.set(ing.name, Number(result.lastInsertRowid));
      } catch {
        // Duplicate name - look it up
        const existing = db.prepare("SELECT id FROM ingredients WHERE name = ?").get(ing.name) as
          | { id: number }
          | undefined;
        if (existing) ingredientMap.set(ing.name, existing.id);
      }
    }
  });
  insertAllIngredients();

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (name, category, prep_level, time_minutes, servings_base, tags, notes, image_emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRecipeIngredient = db.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertRecipeStep = db.prepare(`
    INSERT INTO recipe_steps (recipe_id, step_order, instruction, time_minutes)
    VALUES (?, ?, ?, ?)
  `);

  let recipeCount = 0;

  const insertAllRecipes = db.transaction(() => {
    for (const r of RECIPES) {
      const result = insertRecipe.run(
        r.name,
        r.category,
        r.prep_level,
        r.time_minutes,
        r.servings_base,
        JSON.stringify(r.tags),
        r.notes ?? null,
        r.image_emoji
      );
      const recipeId = Number(result.lastInsertRowid);

      for (const ri of r.ingredients) {
        let ingredientId = ingredientMap.get(ri.name);
        if (!ingredientId) {
          // Try to find by partial match
          const found = db
            .prepare("SELECT id FROM ingredients WHERE name LIKE ? LIMIT 1")
            .get(`%${ri.name}%`) as { id: number } | undefined;
          if (found) {
            ingredientId = found.id;
          } else {
            // Insert with default section
            const defaultSection = sectionMap.get("Almacén") ?? 1;
            const insResult = insertIngredient.run(ri.name, ri.unit, defaultSection);
            ingredientId = Number(insResult.lastInsertRowid);
            ingredientMap.set(ri.name, ingredientId);
          }
        }

        insertRecipeIngredient.run(
          recipeId,
          ingredientId,
          ri.quantity,
          ri.unit,
          ri.is_optional ? 1 : 0,
          ri.notes ?? null
        );
      }

      for (let i = 0; i < r.steps.length; i++) {
        const step = r.steps[i];
        insertRecipeStep.run(recipeId, i + 1, step.instruction, step.time_minutes ?? null);
      }

      recipeCount++;
    }
  });
  insertAllRecipes();

  const sections = (db.prepare("SELECT COUNT(*) as c FROM supermarket_sections").get() as { c: number }).c;
  const ingredients = (db.prepare("SELECT COUNT(*) as c FROM ingredients").get() as { c: number }).c;

  return { sections, ingredients, recipes: recipeCount };
}
