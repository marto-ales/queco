/* E2E test for the meal prep board using system Chrome.
   Usage: start dev server first, then: node scripts/test-prep.mjs */
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
      const m = document.body.innerText.match(/(\d+) de (\d+) tareas/);
      return m ? { done: Number(m[1]), total: Number(m[2]) } : null;
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

  // ---------- PREP BOARD ----------
  await page.goto(`${BASE}/prep`, { waitUntil: "networkidle0" });
  check("Prep page renders", (await page.$eval("main h1", (el) => el.textContent)).includes("Meal Prep"));

  const levelHeadings = await page.$$eval("p.text-sm.font-semibold", (els) => els.map((e) => e.textContent.trim()));
  check(
    "Three prep levels shown",
    ["Preparación", "Cocción en lote", "Armado de viandas"].every((t) => levelHeadings.includes(t)),
    levelHeadings.join(", ")
  );

  const p0 = await progress();
  // each distinct recipe yields 3 tasks
  check("Tasks generated", p0 !== null && p0.total > 0 && p0.total % 3 === 0, p0 ? `${p0.total} tareas` : "none");
  check("Nothing completed initially", p0?.done === 0);

  const taskCount = await page.$$eval('input[type="checkbox"][aria-label^="Completar"]', (els) => els.length);
  check("Checkbox per task", taskCount === p0?.total, `${taskCount} vs ${p0?.total}`);

  const hasLote = await page.evaluate(() => document.body.innerText.includes("Cocinar"));
  const hasPorcionar = await page.evaluate(() => document.body.innerText.includes("Porcionar"));
  check("Task descriptions cover cooking + portioning", hasLote && hasPorcionar);

  // ---------- COMPLETE A TASK ----------
  await page.$$eval('input[type="checkbox"][aria-label^="Completar"]', (els) => els[0].click());
  await waitForText(`1 de ${p0.total} tareas`);
  check("Completing a task updates progress", true, `1/${p0.total}`);

  const struck = await page.$$eval("span.peer-checked\\:line-through", (els) =>
    els.some((e) => getComputedStyle(e).textDecorationLine.includes("line-through"))
  );
  check("Completed task is struck through", struck);

  const recipeEmoji = await page.evaluate(() => {
    const el = document.querySelector("span.peer-checked\\:line-through");
    return el ? el.textContent.trim().length > 0 : false;
  });
  check("Task shows recipe emoji/name", recipeEmoji);

  // ---------- RESET ----------
  await waitSettled();
  await clickButtonByText("↺ Reiniciar");
  await waitForText(`0 de ${p0.total} tareas`);
  check("Reset clears completion", true);

  // ---------- PERSISTENCE across navigation ----------
  await page.$$eval('input[type="checkbox"][aria-label^="Completar"]', (els) => els[1].click());
  await waitForText(`1 de ${p0.total} tareas`);
  await page.goto(`${BASE}/prep`, { waitUntil: "networkidle0" });
  await waitForText(`1 de ${p0.total} tareas`);
  check("Completion persists after reload", true);

  // ---------- EMPTY STATE ----------
  await page.click('a[aria-label="Semana siguiente"]');
  await page.waitForFunction(
    () => document.body.innerText.includes("No hay meal prep para esta semana"),
    { timeout: 10000 }
  );
  check("Next week shows empty state", true);

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
