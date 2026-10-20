"use client";

import { useTransition } from "react";
import { deleteRecipe } from "@/actions/recipes";

export function DeleteRecipeButton({
  recipeId,
  recipeName,
}: {
  recipeId: number;
  recipeName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`¿Eliminar "${recipeName}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      await deleteRecipe(recipeId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="btn-danger text-xs py-1.5 disabled:opacity-50"
      title="Eliminar receta"
    >
      {isPending ? "..." : "🗑"}
    </button>
  );
}
