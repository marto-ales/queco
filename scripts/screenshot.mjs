import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
for (const [name, url] of [["home", "/"], ["planner", "/planner"], ["recipes", "/recipes"]]) {
  await page.goto("http://localhost:3456" + url, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `/tmp/queco-${name}.png` });
}
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto("http://localhost:3456/planner", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: "/tmp/queco-mobile.png" });
await browser.close();
