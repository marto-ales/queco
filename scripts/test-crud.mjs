/* E2E test for recipe CRUD using system Chrome.
   Usage: start dev server first, then: node scripts/test-crud.mjs */
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:3456";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  const consoleErrors = [];
  // React dev-mode user-timing instrumentation occasionally throws a negative
  // timestamp error during rapid client navigation; not an app error.
  const IGNORE = /negative time stamp/;
  page.on("pageerror", (e) => {
    if (!IGNORE.test(String(e))) consoleErrors.push(String(e));
  });

  async function typeClear(selector, text) {
    await page.focus(selector);
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.type(text);
  }

  async function submitAndWait(fn, urlPattern) {
    await fn();
    await page.waitForFunction(
      (pat) => new RegExp(pat).test(location.pathname),
      { timeout: 15000 },
      urlPattern
    );
    await new Promise((r) => setTimeout(r, 300));
  }

  // ---------- CREATE ----------
  await page.goto(`${BASE}/recipes/new`, { waitUntil: "networkidle0" });
  check("GET /recipes/new renders form", await page.$('input[name="name"]') !== null);

  const stamp = Date.now();
  const recipeName = `Receta test ${stamp}`;

  await page.type('input[name="name"]', recipeName);
  await page.select('select[name="category"]', "cena");
  await page.select('select[name="prep_level"]', "express");
  await typeClear('input[name="time_minutes"]', "15");
  await typeClear('input[name="servings_base"]', "2");
  await page.type('input[name="tags"]', "vegetariano, test");
  await page.type('input[name="image_emoji"]', "🧪");

  // first ingredient row
  await page.type('input[name="ing_name[]"]', "Tomate");
  await page.type('input[name="ing_qty[]"]', "3");
  // second ingredient
  await page.$$eval("button", (btns) => {
    const b = btns.find((x) => x.textContent.includes("Agregar") && x.type === "button");
    b.click();
  });
  await page.waitForSelector('input[name="ing_name[]"]:nth-of-type(1)');
  await new Promise((r) => setTimeout(r, 200));
  const ingInputs = await page.$$('input[name="ing_name[]"]');
  await ingInputs[1].type("Aceite de oliva");
  const qtyInputs = await page.$$('input[name="ing_qty[]"]');
  await qtyInputs[1].type("2");

  // steps
  await page.type('textarea[name="step_text[]"]', "Cortar el tomate en cubos.");
  await page.$$eval("button", (btns) => {
    const b = btns.find((x) => x.textContent.includes("Paso") && x.type === "button");
    b.click();
  });
  await new Promise((r) => setTimeout(r, 200));
  const stepAreas = await page.$$('textarea[name="step_text[]"]');
  await stepAreas[1].type("Mezclar con aceite y servir.");

  await submitAndWait(
    () => page.click('button[type="submit"]'),
    "^/recipes/\\d+$"
  );

  const createdUrl = page.url();
  check(
    "Create redirects to recipe detail",
    /\/recipes\/\d+$/.test(createdUrl),
    createdUrl.replace(BASE, "")
  );

  const detailTitle = await page.$eval("main h1", (el) => el.textContent.trim());
  check("Created recipe visible", detailTitle === recipeName, detailTitle);

  const ingredientRows = await page.$$eval("ul li span.font-medium", (els) =>
    els.map((e) => e.textContent.trim())
  );
  check(
    "Ingredients rendered",
    ingredientRows.includes("Tomate") && ingredientRows.includes("Aceite de oliva"),
    ingredientRows.join(", ")
  );

  const stepCount = await page.$$eval("ol li", (els) => els.length);
  check("Steps rendered", stepCount === 2, `${stepCount} pasos`);

  const recipeId = createdUrl.match(/(\d+)$/)?.[1];

  // ---------- PORTION SCALING on new recipe ----------
  await page.goto(`${BASE}/recipes/${recipeId}?servings=4`, { waitUntil: "networkidle0" });
  const scaledQty = await page.$$eval("ul li", (lis) => {
    const row = lis.find((li) => li.textContent.includes("Tomate"));
    return row ? row.querySelector(".font-mono").textContent.trim() : null;
  });
  check("Scaling 3un ×2 → 6un", scaledQty?.startsWith("6"), scaledQty || "not found");

  // ---------- EDIT ----------
  await page.goto(`${BASE}/recipes/${recipeId}/edit`, { waitUntil: "networkidle0" });
  const nameVal = await page.$eval('input[name="name"]', (el) => el.value);
  check("Edit form prefilled", nameVal === recipeName, nameVal);

  await typeClear('input[name="name"]', `${recipeName} editada`);
  await submitAndWait(
    () => page.click('button[type="submit"]'),
    "^/recipes/\\d+$"
  );
  const editTitle = await page.$eval("main h1", (el) => el.textContent.trim());
  check("Edit saved and redirected", editTitle === `${recipeName} editada`, editTitle);

  const ingCountAfterEdit = await page.$$eval("ul li", (els) => els.length);
  check("Ingredients kept after edit", ingCountAfterEdit === 2, `${ingCountAfterEdit} ingredientes`);

  // ---------- LIST + SEARCH ----------
  await page.goto(`${BASE}/recipes?q=${encodeURIComponent(recipeName)}`, {
    waitUntil: "networkidle0",
  });
  const listHasRecipe = await page.evaluate((n) => document.body.innerText.includes(n), `${recipeName} editada`);
  check("Search finds created recipe", listHasRecipe);

  // ---------- DELETE ----------
  page.on("dialog", (d) => d.accept());
  await page.goto(`${BASE}/recipes/${recipeId}`, { waitUntil: "networkidle0" });
  const deleteBtn = await page.$('button[title="Eliminar receta"]');
  check("Delete button present", deleteBtn !== null);
  if (deleteBtn) {
    await submitAndWait(() => deleteBtn.click(), "^/recipes$");
    check("Delete redirects to list", page.url().endsWith("/recipes"), page.url().replace(BASE, ""));
    await page.goto(`${BASE}/recipes/${recipeId}`, { waitUntil: "networkidle0" });
    const is404 = (await page.$("main h1")) && (await page.$eval("main h1", (el) => el.textContent)).includes("404");
    check("Deleted recipe → 404", is404);
  }

  // ---------- DELETE SEED RECIPE GUARD? (skip) ----------

  check("No page errors", consoleErrors.length === 0, consoleErrors.join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} pasaron`);
process.exit(failed.length ? 1 : 0);
