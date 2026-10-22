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
  page.on("dialog", (d) => d.accept());

  // Clean slate: ensure current week exists without meals by visiting planner
  await page.goto(`${BASE}/planner`, { waitUntil: "networkidle0" });

  // Helper: open the picker from any empty slot, clearing the week if full.
  const openPicker = async () => {
    const opened = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /^\+\s*(Almuerzo|Cena)/.test(b.textContent.trim())
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!opened) {
      await page.evaluate(() => {
        const clear = [...document.querySelectorAll("button")].find((b) =>
          b.textContent.includes("Vaciar")
        );
        clear.click();
      });
      await page.waitForFunction(
        () => [...document.querySelectorAll("button")].some((b) => /^\+\s*(Almuerzo|Cena)/.test(b.textContent.trim())),
        { timeout: 10000 }
      );
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((b) =>
          /^\+\s*(Almuerzo|Cena)/.test(b.textContent.trim())
        );
        btn.click();
      });
    }
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  };

  await openPicker();
  check("Picker opens", true);

  // Modal must sit above the mobile bottom nav (z-index) and not be clipped.
  const geom = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const sheet = dialog.querySelector(":scope > div");
    const nav = document.querySelector("nav.fixed");
    const s = sheet.getBoundingClientRect();
    return {
      zDialog: parseInt(getComputedStyle(dialog).zIndex, 10),
      zNav: nav ? parseInt(getComputedStyle(nav).zIndex, 10) : -1,
      top: s.top,
      bottom: s.bottom,
      height: s.height,
      vh: window.innerHeight,
    };
  });
  check("Modal z-index above bottom nav", geom.zDialog > geom.zNav, `modal ${geom.zDialog} vs nav ${geom.zNav}`);
  check("Modal not clipped at top", geom.top >= -1, `top=${Math.round(geom.top)}`);
  check("Modal within viewport", geom.bottom <= geom.vh + 1, `bottom=${Math.round(geom.bottom)} vh=${geom.vh}`);
  check("Modal fills reasonable height", geom.height > geom.vh * 0.4, `h=${Math.round(geom.height)}`);

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

  // Type in search — the page must not jump while the sheet is open.
  const beforeScroll = await page.evaluate(() => window.scrollY);
  await page.type('[role="dialog"] input[placeholder="Buscar receta..."]', "pollo");
  await new Promise((r) => setTimeout(r, 400));
  const afterScroll = await page.evaluate(() => window.scrollY);
  const rootLocked = await page.evaluate(
    () => getComputedStyle(document.documentElement).overflow === "hidden"
  );
  check("Root scroll locked while open", rootLocked);
  check(
    "No body scroll jump on search",
    Math.abs(afterScroll - beforeScroll) < 8,
    `Δ=${afterScroll - beforeScroll}`
  );

  // Results filtered
  const filtered = await page.$$eval('[role="dialog"] button[title="Duplicar como variante"]', (e) => e.length);
  check("Search filters results", filtered > 0 && filtered < 30, `${filtered} resultados`);

  // Body overflow locked while open
  // Body/root locked while open
  const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
  check("Background scroll locked", bodyOverflow === "hidden", bodyOverflow);

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
  await openPicker();
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
