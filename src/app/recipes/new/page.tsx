import { getDb } from "@/lib/db";
import { RecipeForm } from "@/components/recipe-form";
import { createRecipe } from "@/actions/recipes";
import type { Ingredient } from "@/lib/types";

export const instant = false;

export default function NewRecipePage() {
  const db = getDb();
  const allIngredients = db
    .prepare("SELECT id, name, unit, section_id FROM ingredients ORDER BY name")
    .all() as Ingredient[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva receta ➕</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Completá los datos, ingredientes y pasos de preparación.
        </p>
      </div>

      <RecipeForm allIngredients={allIngredients} onSubmit={createRecipe} />
    </div>
  );
}
