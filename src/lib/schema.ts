export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS supermarket_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'un',
  section_id INTEGER NOT NULL REFERENCES supermarket_sections(id)
);

CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('almuerzo','cena','desayuno','snack','postre')),
  prep_level TEXT NOT NULL DEFAULT 'normal' CHECK(prep_level IN ('express','normal','largo')),
  time_minutes INTEGER NOT NULL DEFAULT 30,
  servings_base INTEGER NOT NULL DEFAULT 2,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  image_emoji TEXT
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'un',
  is_optional INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  time_minutes INTEGER
);

CREATE TABLE IF NOT EXISTS week_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')),
  auto_generated INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS planned_meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_plan_id INTEGER NOT NULL REFERENCES week_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
  meal_type TEXT NOT NULL CHECK(meal_type IN ('almuerzo','cena')),
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  servings INTEGER NOT NULL DEFAULT 2,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_plan_id INTEGER NOT NULL REFERENCES week_plans(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prep_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_plan_id INTEGER NOT NULL REFERENCES week_plans(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id),
  level INTEGER NOT NULL CHECK(level IN (1,2,3)),
  task_description TEXT NOT NULL,
  time_minutes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_week ON planned_meals(week_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_week ON shopping_items(week_plan_id);
CREATE INDEX IF NOT EXISTS idx_prep_tasks_week ON prep_tasks(week_plan_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_section ON ingredients(section_id);
`;
