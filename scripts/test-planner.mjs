/* E2E test for the weekly planner using system Chrome.
   Usage: start dev server first, then: node scripts/test-planner.mjs */
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
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("dialog", (d) => d.accept());

  const waitForText = (text, timeout = 15000) =>
    page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);

  // Actions disable buttons while a transition runs; wait before clicking.
  const waitSettled = () =>
    page.waitForFunction(() => ![...document.querySelectorAll("button")].some((b) => b.disabled), {
      timeout: 10000,
    });

  const clickButtonByText = (text) =>
    page.$$eval(
      "button, a",
      (els, t) => {
        const b = els.find((x) => x.textContent.trim() === t);
        if (!b) throw new Error(`button not found: ${t}`);
        b.click();
      },
      text
    );

  const getServings = () =>
    page.$$eval("div", (divs) => {
      const row = divs.find(
        (d) => d.textContent.trim().startsWith("Porciones:") && d.querySelectorAll("button").length === 2
      );
      if (!row) return null;
      const btns = row.querySelectorAll("button");
      return btns[0].nextElementSibling.textContent.trim();
    });

  // ---------- LOAD ----------
  await page.goto(`${BASE}/planner`, { waitUntil: "networkidle0" });
  const h1 = await page.$eval("main h1", (el) => el.textContent.trim());
  check("GET /planner renders", h1.includes("Planificador"), h1);

  // clean start: clear any leftover week
  const hasVaciar = await page.$$eval("button", (b) => b.some((x) => x.textContent.includes("Vaciar")));
  if (hasVaciar) {
    await waitSettled();
    await clickButtonByText("🗑 Vaciar");
    await waitForText("0/14 comidas");
  }
  check("Counter starts at 0/14", (await page.evaluate(() => document.body.innerText)).includes("0/14 comidas"));

  // ---------- ADD MEAL via picker ----------
  await waitSettled();
  await page.$$eval("button", (btns) => {
    const b = btns.find((x) => x.textContent.trim() === "+ Almuerzo");
    if (!b) throw new Error("empty slot not found");
    b.click();
  });
  await page.waitForSelector('div[role="dialog"] input[placeholder="Buscar receta..."]', {
    visible: true,
    timeout: 5000,
  });
  check("Picker dialog opens", true);

  const searchSel = 'div[role="dialog"] input[placeholder="Buscar receta..."]';
  await page.type(searchSel, "pollo");
  await new Promise((r) => setTimeout(r, 250));
  const rowCounts = await page.$$eval('div[role="dialog"] button span.text-2xl', (els) => els.length);
  check("Search 'pollo' filters recipes", rowCounts > 0, `${rowCounts} resultados`);

  await waitSettled();
  await page.$$eval('div[role="dialog"] button', (btns) => {
    const row = btns.find((b) => b.querySelector("span.text-2xl"));
    if (!row) throw new Error("recipe row not found");
    row.click();
  });
  await waitForText("1/14 comidas");
  const dialogGone = await page.$('div[role="dialog"] input[placeholder="Buscar receta..."]');
  check("Picking a recipe adds the meal and closes picker", dialogGone === null);

  // ---------- SERVINGS +/- ----------
  const before = await getServings();
  check("Filled slot shows servings control", before !== null, `servings=${before}`);
  await waitSettled();
  await page.$$eval("div", (divs) => {
    const row = divs.find(
      (d) => d.textContent.trim().startsWith("Porciones:") && d.querySelectorAll("button").length === 2
    );
    row.querySelectorAll("button")[1].click();
  });
  const expected = String(Number(before) + 1);
  await page.waitForFunction(
    (v) => {
      const divs = [...document.querySelectorAll("div")];
      const row = divs.find(
        (d) => d.textContent.trim().startsWith("Porciones:") && d.querySelectorAll("button").length === 2
      );
      if (!row) return false;
      const btns = row.querySelectorAll("button");
      return btns[0].nextElementSibling.textContent.trim() === v;
    },
    { timeout: 10000 },
    expected
  );
  check("Servings + increments", true, `${before} → ${expected}`);

  // ---------- CHANGE RECIPE ----------
  await waitSettled();
  await page.$$eval("button", (btns) => {
    const b = btns.find((x) => x.title === "Cambiar receta");
    if (!b) throw new Error("change button not found");
    b.click();
  });
  await page.waitForSelector(searchSel, { visible: true, timeout: 5000 });
  // desmarcar "solo sugeridas" para poder buscar una receta de cena
  await page.click('div[role="dialog"] input[type="checkbox"]');
  await page.type(searchSel, "sopa");
  await new Promise((r) => setTimeout(r, 250));
  const sopaRows = await page.$$eval('div[role="dialog"] button span.text-2xl', (els) => els.length);
  check("Picker opens on filled slot (change)", sopaRows > 0, `${sopaRows} resultados`);
  if (sopaRows > 0) {
    await waitSettled();
    await page.$$eval('div[role="dialog"] button', (btns) => {
      const row = btns.find((b) => b.querySelector("span.text-2xl"));
      row.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("Sopa de verduras"), {
      timeout: 15000,
    });
    const hasSopa = await page.evaluate(() => document.body.innerText.includes("Sopa de verduras"));
    check("Meal recipe replaced", hasSopa);
  } else {
    await page.click('div[role="dialog"] button[aria-label="Cerrar"]');
  }

  // ---------- REMOVE ----------
  await waitSettled();
  await page.$$eval("button", (btns) => {
    const b = btns.find((x) => x.title === "Quitar");
    if (!b) throw new Error("remove button not found");
    b.click();
  });
  try {
    await waitForText("0/14 comidas", 8000);
    check("Remove clears the meal", true);
  } catch {
    check("Remove clears the meal", false, "counter did not update");
  }

  // ---------- AUTO-GENERATE 3 days ----------
  await waitSettled();
  await clickButtonByText("🎲 Auto-generar");
  await new Promise((r) => setTimeout(r, 150));
  await clickButtonByText("3 días");
  await waitForText("6/14 comidas");
  check("Auto-generate 3 days → 6 meals", true);

  const servingsRows = await page.$$eval("div", (divs) =>
    divs.filter((d) => d.textContent.trim().startsWith("Porciones:") && d.querySelectorAll("button").length === 2)
      .length
  );
  check("6 slots filled with servings controls", servingsRows === 6, `${servingsRows} slots`);

  // ---------- AUTO-GENERATE 7 days (with confirm) ----------
  await waitSettled();
  await clickButtonByText("🎲 Auto-generar");
  await new Promise((r) => setTimeout(r, 150));
  await clickButtonByText("7 días");
  await waitForText("14/14 comidas");
  check("Auto-generate 7 days replaces week → 14 meals", true);

  // ---------- CLEAR ----------
  await waitSettled();
  await clickButtonByText("🗑 Vaciar");
  await waitForText("0/14 comidas");
  check("Clear empties the week", true);

  // ---------- WEEK NAVIGATION ----------
  await page.click('a[aria-label="Semana siguiente"]');
  await page.waitForFunction(() => location.search.includes("week="), { timeout: 10000 });
  check("Next week navigates with ?week=", true, new URL(page.url()).search);

  const backVisible = await page.evaluate(() =>
    [...document.querySelectorAll("a")].some((a) => a.textContent.includes("Volver a esta semana"))
  );
  check("'Back to this week' link shown", backVisible);

  await page.evaluate(() => {
    [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Volver a esta semana")).click();
  });
  await page.waitForFunction(() => location.pathname === "/planner" && location.search === "", {
    timeout: 10000,
  });
  check("Back to current week", true);

  check("No page errors", consoleErrors.length === 0, consoleErrors.join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} pasaron`);
process.exit(failed.length ? 1 : 0);
