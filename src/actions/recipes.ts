"use server";

import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Unit, RecipeCategory, PrepLevel } from "@/lib/types";

type IngredientRow = {
  name: string;
  quantity: number;
  unit: Unit;
  is_optional: boolean;
  notes: string;
};

type StepRow = {
  instruction: string;
  time_minutes: number | null;
};

function parseFormData(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as RecipeCategory;
  const prep_level = formData.get("prep_level") as PrepLevel;
  const time_minutes = parseInt(formData.get("time_minutes") as string, 10) || 30;
  const servings_base = parseInt(formData.get("servings_base") as string, 10) || 2;
  const tagsRaw = (formData.get("tags") as string) || "";
  const image_emoji = (formData.get("image_emoji") as string)?.trim() || "🍽";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  // Parse ingredients: arrays in FormData
  const ingredientNames = formData.getAll("ing_name[]") as string[];
  const ingredientQtys = formData.getAll("ing_qty[]") as string[];
  const ingredientUnits = formData.getAll("ing_unit[]") as string[];
  const ingredientOptional = formData.getAll("ing_optional[]") as string[];
  const ingredientNotes = formData.getAll("ing_notes[]") as string[];

  const ingredients: IngredientRow[] = [];
  for (let i = 0; i < ingredientNames.length; i++) {
    const name = ingredientNames[i]?.trim();
    if (!name) continue;
    ingredients.push({
      name,
      quantity: parseFloat(ingredientQtys[i]) || 0,
      unit: (ingredientUnits[i] || "un") as Unit,
      is_optional: ingredientOptional.includes(String(i)),
      notes: ingredientNotes[i]?.trim() || "",
    });
  }

  // Parse steps
  const stepInstructions = formData.getAll("step_text[]") as string[];
  const stepTimes = formData.getAll("step_time[]") as string[];

  const steps: StepRow[] = [];
  for (let i = 0; i < stepInstructions.length; i++) {
    const instruction = stepInstructions[i]?.trim();
    if (!instruction) continue;
    steps.push({
      instruction,
      time_minutes: stepTimes[i] ? parseInt(stepTimes[i], 10) : null,
    });
  }

  if (!name) return { error: "El nombre es obligatorio" };
  if (ingredients.length === 0) return { error: "Agregá al menos un ingrediente" };
  if (steps.length === 0) return { error: "Agregá al menos un paso de preparación" };

  return { name, category, prep_level, time_minutes, servings_base, tags, image_emoji, notes, ingredients, steps };
}

function findOrCreateIngredient(db: ReturnType<typeof getDb>, name: string, unit: Unit): number {
  const existing = db.prepare("SELECT id FROM ingredients WHERE name = ? COLLATE NOCASE").get(name) as
    | { id: number }
    | undefined;
  if (existing) return existing.id;

  const defaultSection = (db.prepare("SELECT id FROM supermarket_sections WHERE name = 'Almacén'").get() as
    | { id: number }
    | undefined)?.id ?? 1;

  const result = db
    .prepare("INSERT INTO ingredients (name, unit, section_id) VALUES (?, ?, ?)")
    .run(name, unit, defaultSection);
  return Number(result.lastInsertRowid);
}

export async function createRecipe(formData: FormData) {
  const parsed = parseFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  const db = getDb();

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (name, category, prep_level, time_minutes, servings_base, tags, notes, image_emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRI = db.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertStep = db.prepare(`
    INSERT INTO recipe_steps (recipe_id, step_order, instruction, time_minutes)
    VALUES (?, ?, ?, ?)
  `);

  const recipeId = db.transaction(() => {
    const result = insertRecipe.run(
      parsed.name,
      parsed.category,
      parsed.prep_level,
      parsed.time_minutes,
      parsed.servings_base,
      JSON.stringify(parsed.tags),
      parsed.notes,
      parsed.image_emoji
    );
    const rid = Number(result.lastInsertRowid);

    for (const ing of parsed.ingredients) {
      const ingId = findOrCreateIngredient(db, ing.name, ing.unit);
      insertRI.run(rid, ingId, ing.quantity, ing.unit, ing.is_optional ? 1 : 0, ing.notes || null);
    }

    for (let i = 0; i < parsed.steps.length; i++) {
      insertStep.run(rid, i + 1, parsed.steps[i].instruction, parsed.steps[i].time_minutes);
    }

    return rid;
  })();

  revalidatePath("/recipes");
  revalidatePath("/");
  redirect(`/recipes/${recipeId}`);
}

export async function updateRecipe(recipeId: number, formData: FormData) {
  const parsed = parseFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  const db = getDb();

  const updateRecipeStmt = db.prepare(`
    UPDATE recipes SET name = ?, category = ?, prep_level = ?, time_minutes = ?,
    servings_base = ?, tags = ?, notes = ?, image_emoji = ? WHERE id = ?
  `);

  db.transaction(() => {
    updateRecipeStmt.run(
      parsed.name,
      parsed.category,
      parsed.prep_level,
      parsed.time_minutes,
      parsed.servings_base,
      JSON.stringify(parsed.tags),
      parsed.notes,
      parsed.image_emoji,
      recipeId
    );

    // Delete old ingredients and steps, insert new
    db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(recipeId);
    db.prepare("DELETE FROM recipe_steps WHERE recipe_id = ?").run(recipeId);

    const insertRI = db.prepare(`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertStep = db.prepare(`
      INSERT INTO recipe_steps (recipe_id, step_order, instruction, time_minutes)
      VALUES (?, ?, ?, ?)
    `);

    for (const ing of parsed.ingredients) {
      const ingId = findOrCreateIngredient(db, ing.name, ing.unit);
      insertRI.run(recipeId, ingId, ing.quantity, ing.unit, ing.is_optional ? 1 : 0, ing.notes || null);
    }

    for (let i = 0; i < parsed.steps.length; i++) {
      insertStep.run(recipeId, i + 1, parsed.steps[i].instruction, parsed.steps[i].time_minutes);
    }
  })();

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/");
  redirect(`/recipes/${recipeId}`);
}

export async function deleteRecipe(recipeId: number) {
  const db = getDb();
  db.prepare("DELETE FROM recipes WHERE id = ?").run(recipeId);
  revalidatePath("/recipes");
  revalidatePath("/");
  redirect("/recipes");
}
