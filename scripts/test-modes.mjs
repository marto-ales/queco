/* E2E test for Phase 6 pages (Express, Chaos, Breakfast) using system Chrome.
   Usage: start dev server first, then: node scripts/test-modes.mjs */
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

  // ================= EXPRESS =================
  await page.goto(`${BASE}/express`, { waitUntil: "networkidle0" });
  const h1 = await page.$eval("main h1", (el) => el.textContent.trim());
  check("Express page renders", h1.includes("Express"), h1);

  const expressCount = await page.$$eval("main a[href^='/recipes/']", (els) => els.length);
  check("Express lists recipes", expressCount > 0, `${expressCount} recetas`);

  const maxTimes = await page.$$eval("main a[href^='/recipes/'] span.badge", (els) =>
    els
      .filter((e) => e.textContent.includes("min"))
      .map((e) => parseInt(e.textContent.replace(/\D/g, ""), 10))
  );
  check(
    "All express recipes ≤ 20 min",
    maxTimes.length > 0 && maxTimes.every((m) => m <= 20),
    `max ${Math.max(...maxTimes)} min`
  );

  // filter ≤ 15 min
  await page.evaluate(() => {
    [...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "≤ 15 min").click();
  });
  await page.waitForFunction(() => location.search.includes("max=15"), { timeout: 10000 });
  const times15 = await page.$$eval("main a[href^='/recipes/'] span.badge", (els) =>
    els
      .filter((e) => e.textContent.includes("min"))
      .map((e) => parseInt(e.textContent.replace(/\D/g, ""), 10))
  );
  check(
    "≤15 filter only shows ≤15 min",
    times15.length > 0 && times15.every((m) => m <= 15),
    `max ${Math.max(...times15)} min`
  );

  // navigate into a recipe
  await page.evaluate(() => document.querySelector("main a[href^='/recipes/']").click());
  await page.waitForFunction(() => /\/recipes\/\d+$/.test(location.pathname), { timeout: 10000 });
  check("Express recipe opens detail", true);

  // ================= CHAOS =================
  await page.goto(`${BASE}/chaos`, { waitUntil: "networkidle0" });
  const chaosH1 = await page.$eval("main h1", (el) => el.textContent.trim());
  check("Chaos page renders", chaosH1.includes("Caos"), chaosH1);

  const baseItems = await page.$$eval("ul li", (els) => els.length);
  check("Chaos base list populated", baseItems >= 8, `${baseItems} items base`);

  const mealCards = await page.evaluate(() => {
    const heading = [...document.querySelectorAll("h2")].find((h) =>
      h.textContent.includes("Platos que salen")
    );
    return heading ? heading.parentElement.parentElement.querySelectorAll(".card").length : 0;
  });
  check("Chaos lists combinable meals", mealCards >= 10, `${mealCards} platos`);

  const hasNeeds = await page.evaluate(() => /de la base/i.test(document.body.innerText));
  const hasExtras = await page.evaluate(() => /extras/i.test(document.body.innerText));
  check("Meals show base ingredients + extras", hasNeeds && hasExtras);

  // ================= BREAKFAST =================
  await page.goto(`${BASE}/breakfast`, { waitUntil: "networkidle0" });
  const bH1 = await page.$eval("main h1", (el) => el.textContent.trim());
  check("Breakfast page renders", bH1.includes("Desayunos"), bH1);

  const baseCards = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((x) => x.textContent.includes("Bases"));
    return h ? h.parentElement.parentElement.querySelectorAll("a[href^='/recipes/']").length : 0;
  });
  check("Breakfast shows bases", baseCards >= 5, `${baseCards} bases`);

  const extraCards = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((x) =>
      x.textContent.includes("Snacks y postres")
    );
    return h ? h.parentElement.parentElement.querySelectorAll("a[href^='/recipes/']").length : 0;
  });
  check("Breakfast shows snacks/desserts", extraCards >= 3, `${extraCards} extras`);

  const hasRoleBadge = await page.evaluate(() =>
    [...document.querySelectorAll("span.badge")].some((b) =>
      ["Base", "Snack", "Postre"].includes(b.textContent.trim())
    )
  );
  check("Mix & match role badges shown", hasRoleBadge);

  check("No page errors", consoleErrors.length === 0, consoleErrors.join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} pasaron`);
process.exit(failed.length ? 1 : 0);
