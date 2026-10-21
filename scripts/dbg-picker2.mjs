import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e)));
await page.goto("http://localhost:3456/planner", { waitUntil: "networkidle0" });
// clear leftovers
const hasVaciar = await page.$$eval("button", (b) => b.some((x) => x.textContent.includes("Vaciar")));
if (hasVaciar) { await page.$$eval("button", (b) => b.find((x) => x.textContent.includes("Vaciar")).click()); await page.waitForFunction(() => document.body.innerText.includes("0/14")); }
// add meal
await page.$$eval("button", (b) => b.find((x) => x.textContent.trim() === "+ Almuerzo").click());
await page.waitForSelector('div[role="dialog"] input[placeholder="Buscar receta..."]', { visible: true });
await page.type('div[role="dialog"] input[placeholder="Buscar receta..."]', "pollo");
await new Promise((r) => setTimeout(r, 250));
await page.$$eval('div[role="dialog"] button', (btns) => btns.find((b) => b.querySelector("span.text-2xl")).click());
await page.waitForFunction(() => document.body.innerText.includes("1/14"));
// open change picker
await page.$$eval("button", (btns) => btns.find((x) => x.title === "Cambiar receta").click());
await page.waitForSelector('div[role="dialog"] input[placeholder="Buscar receta..."]', { visible: true });
await page.click('div[role="dialog"] input[type="checkbox"]');
console.log("checkbox:", await page.$eval('div[role="dialog"] input[type="checkbox"]', (e) => e.checked));
await page.type('div[role="dialog"] input[placeholder="Buscar receta..."]', "sopa");
await new Promise((r) => setTimeout(r, 400));
console.log("search:", await page.$eval('div[role="dialog"] input[placeholder="Buscar receta..."]', (e) => e.value));
console.log("rows:", await page.$$eval('div[role="dialog"] button span.text-2xl', (e) => e.length));
console.log("dialog:", (await page.$eval('div[role="dialog"]', (e) => e.innerText)).slice(0, 300));
await browser.close();
