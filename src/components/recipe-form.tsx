"use client";

import { useState, useTransition } from "react";
import type { RecipeWithDetails, Ingredient, Unit, RecipeCategory, PrepLevel } from "@/lib/types";

const CATEGORIES: { value: RecipeCategory; label: string }[] = [
  { value: "almuerzo", label: "🍽 Almuerzo" },
  { value: "cena", label: "🌙 Cena" },
  { value: "desayuno", label: "🌅 Desayuno" },
  { value: "snack", label: "🥜 Snack" },
  { value: "postre", label: "🍰 Postre" },
];

const PREP_LEVELS: { value: PrepLevel; label: string }[] = [
  { value: "express", label: "🚀 Express (<20 min)" },
  { value: "normal", label: "⏱ Normal (20-45 min)" },
  { value: "largo", label: "🐢 Largo (>45 min)" },
];

const UNITS: Unit[] = ["g", "ml", "un", "cda", "cdta", "taza", "diente", "rebanada", "ramita"];

type IngredientFormRow = {
  name: string;
  quantity: string;
  unit: Unit;
  is_optional: boolean;
  notes: string;
};

type StepFormRow = {
  instruction: string;
  time_minutes: string;
};

type Props = {
  recipe?: RecipeWithDetails;
  allIngredients: Ingredient[];
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>;
};

export function RecipeForm({ recipe, allIngredients, onSubmit }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<IngredientFormRow[]>(
    recipe
      ? recipe.ingredients.map((ri) => ({
          name: ri.ingredient_name,
          quantity: String(ri.quantity),
          unit: ri.unit,
          is_optional: ri.is_optional === 1,
          notes: ri.notes || "",
        }))
      : [{ name: "", quantity: "", unit: "un", is_optional: false, notes: "" }]
  );

  const [steps, setSteps] = useState<StepFormRow[]>(
    recipe
      ? recipe.steps.map((s) => ({
          instruction: s.instruction,
          time_minutes: s.time_minutes ? String(s.time_minutes) : "",
        }))
      : [{ instruction: "", time_minutes: "" }]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Handle optional checkboxes: FormData.getAll only returns checked ones,
    // so we send the index for each checked box
    formData.delete("ing_optional[]");
    ingredients.forEach((ing, i) => {
      if (ing.is_optional) formData.append("ing_optional[]", String(i));
    });

    startTransition(async () => {
      const result = await onSubmit(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  };

  const addIngredient = () =>
    setIngredients((prev) => [
      ...prev,
      { name: "", quantity: "", unit: "un", is_optional: false, notes: "" },
    ]);

  const removeIngredient = (idx: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx));

  const updateIngredient = (idx: number, field: keyof IngredientFormRow, value: string | boolean) =>
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)));

  const addStep = () => setSteps((prev) => [...prev, { instruction: "", time_minutes: "" }]);
  const removeStep = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx));
  const updateStep = (idx: number, field: keyof StepFormRow, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="card p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-lg">Datos básicos</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre *</label>
            <input
              type="text"
              name="name"
              defaultValue={recipe?.name || ""}
              required
              placeholder="Ej: Milanesas al horno"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Emoji</label>
            <input
              type="text"
              name="image_emoji"
              defaultValue={recipe?.image_emoji || ""}
              placeholder="🥩"
              className="input w-24"
              maxLength={4}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Categoría</label>
            <select name="category" defaultValue={recipe?.category || "almuerzo"} className="input">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nivel</label>
            <select name="prep_level" defaultValue={recipe?.prep_level || "normal"} className="input">
              {PREP_LEVELS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Porciones base</label>
            <input
              type="number"
              name="servings_base"
              defaultValue={recipe?.servings_base || 2}
              min={1}
              max={20}
              className="input"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tiempo (minutos)</label>
            <input
              type="number"
              name="time_minutes"
              defaultValue={recipe?.time_minutes || 30}
              min={1}
              max={600}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Tags <span className="text-zinc-400 font-normal">(separados por coma)</span>
            </label>
            <input
              type="text"
              name="tags"
              defaultValue={recipe ? JSON.parse(recipe.tags).join(", ") : ""}
              placeholder="vegetariano, rapido, clasico"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Notas (opcional)</label>
          <textarea
            name="notes"
            defaultValue={recipe?.notes || ""}
            rows={2}
            placeholder="Tip, variante, maridaje..."
            className="input resize-none"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">🛒 Ingredientes *</h2>
          <button type="button" onClick={addIngredient} className="btn-secondary text-xs py-1.5">
            + Agregar
          </button>
        </div>

        <datalist id="ingredient-list">
          {allIngredients.map((ing) => (
            <option key={ing.id} value={ing.name} />
          ))}
        </datalist>

        <div className="space-y-3">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 items-start">
              <input
                type="text"
                name="ing_name[]"
                value={ing.name}
                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                list="ingredient-list"
                placeholder="Ingrediente"
                required
                className="input flex-1 min-w-[140px]"
              />
              <input
                type="number"
                name="ing_qty[]"
                value={ing.quantity}
                onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
                placeholder="Cant."
                step="0.01"
                min="0"
                required
                className="input w-20"
              />
              <select
                name="ing_unit[]"
                value={ing.unit}
                onChange={(e) => updateIngredient(idx, "unit", e.target.value as Unit)}
                className="input w-24"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="ing_notes[]"
                value={ing.notes}
                onChange={(e) => updateIngredient(idx, "notes", e.target.value)}
                placeholder="Nota"
                className="input w-24 hidden md:block"
              />
              <label className="flex items-center gap-1 text-xs text-zinc-500 shrink-0 mt-2 md:mt-0">
                <input
                  type="checkbox"
                  checked={ing.is_optional}
                  onChange={(e) => updateIngredient(idx, "is_optional", e.target.checked)}
                  className="rounded"
                />
                Opc.
              </label>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="text-red-400 hover:text-red-600 text-lg px-1 shrink-0 mt-1 md:mt-0"
                  title="Eliminar"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">👨‍🍳 Preparación *</h2>
          <button type="button" onClick={addStep} className="btn-secondary text-xs py-1.5">
            + Paso
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-1.5">
                {idx + 1}
              </span>
              <textarea
                name="step_text[]"
                value={step.instruction}
                onChange={(e) => updateStep(idx, "instruction", e.target.value)}
                placeholder="Descripción del paso..."
                required
                rows={2}
                className="input flex-1 resize-none"
              />
              <input
                type="number"
                name="step_time[]"
                value={step.time_minutes}
                onChange={(e) => updateStep(idx, "time_minutes", e.target.value)}
                placeholder="Min"
                min={0}
                className="input w-16 shrink-0"
                title="Tiempo en minutos (opcional)"
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="text-red-400 hover:text-red-600 text-lg px-1 shrink-0 mt-1"
                  title="Eliminar"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="btn-primary flex-1 md:flex-none disabled:opacity-50">
          {isPending ? "Guardando..." : recipe ? "💾 Guardar cambios" : "➕ Crear receta"}
        </button>
        <a href={recipe ? `/recipes/${recipe.id}` : "/recipes"} className="btn-secondary">
          Cancelar
        </a>
      </div>
    </form>
  );
}
