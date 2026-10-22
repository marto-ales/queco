/* E2E mobile test for planner recipe picker improvements.
   Usage: node scripts/test-picker.mjs */
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
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setUserAgent(
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36"
  );
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // Clean slate: ensure current week exists without meals by visiting planner
  await page.goto(`${BASE}/planner`, { waitUntil: "networkidle0" });

  // Open the picker from an empty slot (first "+ Almuerzo" button)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.trim().startsWith("+ Almuerzo")
    );
    btn.click();
  });
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  check("Picker opens", true);

  // Search input present
  const hasSearch = await page.$('[role="dialog"] input[placeholder="Buscar receta..."]');
  check("Picker has search input", !!hasSearch);

  // Create-new action present
  const hasCreate = await page.evaluate(() =>
    [...document.querySelectorAll('[role="dialog"] button')].some((b) =>
      b.textContent.includes("Crear receta nueva")
    )
  );
  check("Picker has 'Crear receta nueva' action", hasCreate);

  // Duplicate and edit actions present
  const hasDup = await page.$$eval('[role="dialog"] button[title="Duplicar como variante"]', (e) => e.length);
  const hasEdit = await page.$$eval('[role="dialog"] button[title="Editar receta"]', (e) => e.length);
  check("Rows have duplicate action", hasDup > 0, `${hasDup} botones`);
  check("Rows have edit action", hasEdit > 0, `${hasEdit} botones`);

  // Sheet is scrollable (overflow-y auto) and within viewport
  const sheetScrollable = await page.evaluate(() => {
    const list = document.querySelector('[role="dialog"] .overflow-y-auto');
    return list && list.scrollHeight > list.clientHeight;
  });
  check("Result list is scrollable", sheetScrollable);

  // Type in search — the pinned body must keep the page from jumping.
  const beforeTop = await page.evaluate(() => document.body.getBoundingClientRect().top);
  await page.type('[role="dialog"] input[placeholder="Buscar receta..."]', "pollo");
  await new Promise((r) => setTimeout(r, 400));
  const bodyFixed = await page.evaluate(() => getComputedStyle(document.body).position);
  const afterTop = await page.evaluate(() => document.body.getBoundingClientRect().top);
  check("Body pinned while open", bodyFixed === "fixed", bodyFixed);
  check(
    "No visual scroll jump on search",
    Math.abs(afterTop - beforeTop) < 8,
    `Δ=${afterTop - beforeTop}`
  );

  // Results filtered
  const filtered = await page.$$eval('[role="dialog"] button[title="Duplicar como variante"]', (e) => e.length);
  check("Search filters results", filtered > 0 && filtered < 30, `${filtered} resultados`);

  // Body overflow locked while open
  check("Background scroll locked", bodyFixed === "fixed", bodyFixed);

  // Click create-new navigates to /recipes/new?from=almuerzo
  await page.evaluate(() => {
    [...document.querySelectorAll('[role="dialog"] button')]
      .find((b) => b.textContent.includes("Crear receta nueva"))
      .click();
  });
  await page.waitForFunction(() => location.pathname === "/recipes/new", { timeout: 10000 });
  const qs = await page.evaluate(() => location.search);
  check("Create-new navigates with category", qs.includes("from=almuerzo"), qs);

  // Duplicate link from picker
  await page.goto(`${BASE}/planner`, { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.trim().startsWith("+ Almuerzo")
    );
    btn.click();
  });
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('[role="dialog"] button[title="Duplicar como variante"]').click();
  });
  await page.waitForFunction(() => /\/recipes\/\d+\/duplicate$/.test(location.pathname), { timeout: 10000 });
  const dupH1 = await page.$eval("main h1", (el) => el.textContent.trim());
  check("Duplicate page opens prefilled", dupH1.includes("variante"), dupH1);

  const prefilledName = await page.$eval('input[name="name"]', (el) => el.value);
  check("Duplicate form prefilled with source name", prefilledName.startsWith("Copia de"), prefilledName);

  check("No page errors", errors.length === 0, errors.join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} pasaron`);
process.exit(failed.length ? 1 : 0);
