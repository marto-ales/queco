import { getDb, isSeeded } from "./db";
import { SECTIONS, INGREDIENTS, RECIPES, type SeedRecipe } from "./seed-data";

function insertRecipes(db: ReturnType<typeof getDb>, recipes: SeedRecipe[]): number {
  const sectionMap = new Map<string, number>();
  for (const row of db.prepare("SELECT id, name FROM supermarket_sections").all() as {
    id: number;
    name: string;
  }[]) {
    sectionMap.set(row.name, row.id);
  }

  const ingredientMap = new Map<string, number>();
  for (const row of db.prepare("SELECT id, name FROM ingredients").all() as {
    id: number;
    name: string;
  }[]) {
    ingredientMap.set(row.name, row.id);
  }

  const insertIngredient = db.prepare(
    "INSERT INTO ingredients (name, unit, section_id) VALUES (?, ?, ?)"
  );
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

  const run = db.transaction(() => {
    for (const r of recipes) {
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
          const found = db
            .prepare("SELECT id FROM ingredients WHERE name LIKE ? LIMIT 1")
            .get(`%${ri.name}%`) as { id: number } | undefined;
          if (found) {
            ingredientId = found.id;
          } else {
            const defaultSection = sectionMap.get("Almacén") ?? 1;
            const insResult = insertIngredient.run(ri.name, ri.unit, defaultSection);
            ingredientId = Number(insResult.lastInsertRowid);
          }
          ingredientMap.set(ri.name, ingredientId);
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
  run();

  return recipeCount;
}

export function seedDatabase(): { sections: number; ingredients: number; recipes: number } {
  const db = getDb();

  if (isSeeded(db)) {
    // Backfill any recipes added to seed-data since the initial seed.
    const existing = new Set(
      (db.prepare("SELECT name FROM recipes").all() as { name: string }[]).map((r) => r.name)
    );
    const missing = RECIPES.filter((r) => !existing.has(r.name));
    if (missing.length > 0) insertRecipes(db, missing);

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

  const insertAllIngredients = db.transaction(() => {
    for (const ing of INGREDIENTS) {
      const sectionId = sectionMap.get(ing.section);
      if (!sectionId) continue;
      try {
        insertIngredient.run(ing.name, ing.unit, sectionId);
      } catch {
        // Duplicate name - ignore
      }
    }
  });
  insertAllIngredients();

  const recipeCount = insertRecipes(db, RECIPES);

  const sections = (db.prepare("SELECT COUNT(*) as c FROM supermarket_sections").get() as { c: number }).c;
  const ingredients = (db.prepare("SELECT COUNT(*) as c FROM ingredients").get() as { c: number }).c;

  return { sections, ingredients, recipes: recipeCount };
}
