import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3456";
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
page.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 500)));
page.on("request", (r) => {
  if (r.method() === "POST") console.log("[POST req]", r.url());
});

async function typeClear(selector, text) {
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, text);
}

await page.goto(`${BASE}/recipes/new`, { waitUntil: "networkidle0" });
await page.type('input[name="name"]', `Debug full ${Date.now()}`);
await page.select('select[name="category"]', "cena");
await page.select('select[name="prep_level"]', "express");
await typeClear('input[name="time_minutes"]', "15");
await typeClear('input[name="servings_base"]', "2");
await page.type('input[name="tags"]', "vegetariano, test");
await page.type('input[name="image_emoji"]', "🧪");

await page.type('input[name="ing_name[]"]', "Tomate");
await page.type('input[name="ing_qty[]"]', "3");

await page.$$eval("button", (btns) => {
  const b = btns.find((x) => x.textContent.includes("Agregar") && x.type === "button");
  b.click();
});
await new Promise((r) => setTimeout(r, 300));
const ingInputs = await page.$$('input[name="ing_name[]"]');
await ingInputs[1].type("Aceite de oliva");
const qtyInputs = await page.$$('input[name="ing_qty[]"]');
await qtyInputs[1].type("2");

await page.type('textarea[name="step_text[]"]', "Cortar tomate.");
await page.$$eval("button", (btns) => {
  const b = btns.find((x) => x.textContent.includes("Paso") && x.type === "button");
  b.click();
});
await new Promise((r) => setTimeout(r, 300));
const stepAreas = await page.$$('textarea[name="step_text[]"]');
await stepAreas[1].type("Mezclar.");

const v = await page.evaluate(() => {
  const form = document.querySelector("form");
  const invalid = [...form.elements]
    .filter((el) => !el.checkValidity())
    .map((el) => ({ name: el.name, type: el.type, value: el.value, msg: el.validationMessage }));
  return { valid: form.checkValidity(), invalid };
});
console.log("VALIDITY:", JSON.stringify(v, null, 2));

await browser.close();
