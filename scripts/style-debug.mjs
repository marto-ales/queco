import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto("http://localhost:3456/", { waitUntil: "networkidle0" });
const info = await page.evaluate(() => {
  const sheets = [...document.styleSheets].map((s) => s.href || "(inline)");
  const rules = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === ".card" || rule.selectorText === ".btn-primary") {
          rules.push({ href: sheet.href?.split("/").pop(), sel: rule.selectorText, css: rule.cssText.slice(0, 180) });
        }
      }
    } catch {}
  }
  const card = document.querySelector(".card");
  return {
    sheets,
    rules,
    cardClass: card?.className,
    bodyBg: getComputedStyle(document.body).backgroundImage.slice(0, 80),
    loaded: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute("href")),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
