import { getDb } from "@/lib/db";
import { RecipeForm } from "@/components/recipe-form";
import { createRecipe } from "@/actions/recipes";
import type { Ingredient, RecipeCategory } from "@/lib/types";

export const instant = false;

const CATEGORIES: RecipeCategory[] = ["almuerzo", "cena", "desayuno", "snack", "postre"];

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  const defaultCategory = CATEGORIES.includes(sp.from as RecipeCategory)
    ? (sp.from as RecipeCategory)
    : "almuerzo";

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

      <RecipeForm
        allIngredients={allIngredients}
        onSubmit={createRecipe}
        defaultCategory={defaultCategory}
      />
    </div>
  );
}
