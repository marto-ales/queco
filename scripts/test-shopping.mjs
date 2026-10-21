/* E2E test for the shopping list using system Chrome.
   Usage: start dev server first, then: node scripts/test-shopping.mjs */
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

  const progress = () =>
    page.evaluate(() => {
      const m = document.body.innerText.match(/(\d+) de (\d+) productos/);
      return m ? { checked: Number(m[1]), total: Number(m[2]) } : null;
    });

  // ---------- SETUP: plan 3 days ----------
  await page.goto(`${BASE}/planner`, { waitUntil: "networkidle0" });
  await waitForText("/14 comidas");
  const hasVaciar = await page.$$eval("button", (b) => b.some((x) => x.textContent.includes("Vaciar")));
  if (hasVaciar) {
    await waitSettled();
    await clickButtonByText("🗑 Vaciar");
    await waitForText("0/14 comidas");
  }
  await waitSettled();
  await clickButtonByText("🎲 Auto-generar");
  await new Promise((r) => setTimeout(r, 150));
  await clickButtonByText("3 días");
  await waitForText("6/14 comidas");

  // ---------- SHOPPING LIST ----------
  await page.goto(`${BASE}/shopping`, { waitUntil: "networkidle0" });
  check("Shopping page renders", (await page.$eval("main h1", (el) => el.textContent)).includes("Lista de compras"));

  const p0 = await progress();
  check("List has items", p0 !== null && p0.total > 0, p0 ? `${p0.total} productos` : "no progress found");
  check("Nothing checked initially", p0?.checked === 0);

  const sectionCount = await page.$$eval("h2", (els) =>
    els.filter((h) => h.textContent.trim().length > 2).length
  );
  check("Items grouped by supermarket section", sectionCount >= 2, `${sectionCount} secciones`);

  const sectionNames = await page.$$eval("h2", (els) => els.map((h) => h.textContent.trim()));
  check(
    "Uses known section names",
    sectionNames.some((n) => ["Verdulería", "Carnicería", "Almacén", "Lácteos y Huevos", "Aves y Pescados", "Panadería", "Congelados", "Bebidas"].some((s) => n.includes(s))),
    sectionNames.join(", ")
  );

  const itemCount = await page.$$eval('input[type="checkbox"][aria-label^="Marcar"]', (els) => els.length);
  check("Checkbox per item", itemCount === p0?.total, `${itemCount} checkboxes vs ${p0?.total} items`);

  // ---------- CHECK AN ITEM ----------
  await page.$$eval('input[type="checkbox"][aria-label^="Marcar"]', (els) => els[0].click());
  await waitForText(`1 de ${p0.total} productos`);
  check("Checking an item updates progress", true, `1/${p0.total}`);

  const struck = await page.$$eval("label span.peer-checked\\:line-through", (els) =>
    els.some((e) => getComputedStyle(e).textDecorationLine.includes("line-through"))
  );
  check("Checked item is struck through", struck);

  // ---------- UNCHECK ALL ----------
  await waitSettled();
  await clickButtonByText("↺ Desmarcar todo");
  await waitForText(`0 de ${p0.total} productos`);
  check("Uncheck all resets progress", true);

  const uncheckedBox = await page.$$eval('input[type="checkbox"][aria-label^="Marcar"]', (els) =>
    els.every((e) => !e.checked)
  );
  check("All checkboxes visually unchecked", uncheckedBox);

  // ---------- WEEK NAVIGATION ----------
  await page.click('a[aria-label="Semana siguiente"]');
  await page.waitForFunction(() => document.body.innerText.includes("Todavía no hay nada para comprar"), {
    timeout: 10000,
  });
  check("Next week shows empty state", true);

  await page.evaluate(() => {
    [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Volver a esta semana")).click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("productos"), { timeout: 10000 });
  check("Back to current week shows the list again", true);

  // ---------- CLEANUP ----------
  await page.goto(`${BASE}/planner`, { waitUntil: "networkidle0" });
  await waitSettled();
  await clickButtonByText("🗑 Vaciar");
  await waitForText("0/14 comidas");
  check("Cleanup: week cleared", true);

  check("No page errors", consoleErrors.length === 0, consoleErrors.join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} pasaron`);
process.exit(failed.length ? 1 : 0);
