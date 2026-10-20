import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getRecipeById } from "@/lib/recipes";
import { RecipeForm } from "@/components/recipe-form";
import { updateRecipe } from "@/actions/recipes";
import type { Ingredient } from "@/lib/types";

export const instant = false;

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) notFound();

  const recipe = getRecipeById(recipeId);
  if (!recipe) notFound();

  const db = getDb();
  const allIngredients = db
    .prepare("SELECT id, name, unit, section_id FROM ingredients ORDER BY name")
    .all() as Ingredient[];

  const updateAction = updateRecipe.bind(null, recipeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar receta ✏️</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">{recipe.name}</p>
      </div>

      <RecipeForm recipe={recipe} allIngredients={allIngredients} onSubmit={updateAction} />
    </div>
  );
}
