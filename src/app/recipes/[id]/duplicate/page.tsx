import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getRecipeById } from "@/lib/recipes";
import { RecipeForm } from "@/components/recipe-form";
import { createRecipe } from "@/actions/recipes";
import type { Ingredient, RecipeWithDetails } from "@/lib/types";

export const instant = false;

export default async function DuplicateRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) notFound();

  const source = getRecipeById(recipeId);
  if (!source) notFound();

  const db = getDb();
  const allIngredients = db
    .prepare("SELECT id, name, unit, section_id FROM ingredients ORDER BY name")
    .all() as Ingredient[];

  const draft: RecipeWithDetails = {
    ...source,
    id: 0,
    name: `Copia de ${source.name}`,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear variante ⧉</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          A partir de <span className="font-medium">{source.name}</span>. Ajustá el nombre e
          ingredientes y guardá como receta nueva.
        </p>
      </div>

      <RecipeForm recipe={draft} allIngredients={allIngredients} onSubmit={createRecipe} isDuplicate />
    </div>
  );
}
