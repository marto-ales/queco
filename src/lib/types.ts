export type Unit = "g" | "ml" | "un" | "cdta" | "cda" | "taza" | "diente" | "rebanada" | "ramita";

export type RecipeCategory = "almuerzo" | "cena" | "desayuno" | "snack" | "postre";

export type PrepLevel = "express" | "normal" | "largo";

export type SupermarketSection = {
  id: number;
  name: string;
  sort_order: number;
};

export type Ingredient = {
  id: number;
  name: string;
  unit: Unit;
  section_id: number;
};

export type IngredientWithSection = Ingredient & {
  section_name: string;
  section_sort: number;
};

export type Recipe = {
  id: number;
  name: string;
  category: RecipeCategory;
  prep_level: PrepLevel;
  time_minutes: number;
  servings_base: number;
  tags: string;
  notes: string | null;
  image_emoji: string | null;
};

export type RecipeIngredient = {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  quantity: number;
  unit: Unit;
  is_optional: number;
  notes: string | null;
};

export type RecipeIngredientFull = RecipeIngredient & {
  ingredient_name: string;
  section_name: string;
  section_sort: number;
};

export type RecipeStep = {
  id: number;
  recipe_id: number;
  step_order: number;
  instruction: string;
  time_minutes: number | null;
};

export type RecipeWithDetails = Recipe & {
  ingredients: RecipeIngredientFull[];
  steps: RecipeStep[];
};

export type RecipeListItem = Recipe & {
  ingredient_count: number;
};

export type WeekPlan = {
  id: number;
  week_start: string;
  status: string;
  auto_generated: number;
  created_at: string;
};

export type PlannedMeal = {
  id: number;
  week_plan_id: number;
  day_of_week: number;
  meal_type: "almuerzo" | "cena";
  recipe_id: number | null;
  servings: number;
  notes: string | null;
};

export type PlannedMealFull = PlannedMeal & {
  recipe_name: string | null;
  recipe_emoji: string | null;
  recipe_time: number | null;
};

export type ShoppingItem = {
  id: number;
  week_plan_id: number;
  ingredient_id: number;
  quantity: number;
  unit: Unit;
  checked: number;
};

export type ShoppingItemFull = ShoppingItem & {
  ingredient_name: string;
  section_name: string;
  section_sort: number;
};

export type PrepTask = {
  id: number;
  week_plan_id: number;
  recipe_id: number;
  level: 1 | 2 | 3;
  task_description: string;
  time_minutes: number;
  sort_order: number;
};
