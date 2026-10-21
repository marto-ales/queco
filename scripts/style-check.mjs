import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto("http://localhost:3456/", { waitUntil: "networkidle0" });
const s = await page.evaluate(() => {
  const cs = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const c = getComputedStyle(el);
    return { radius: c.borderRadius, blur: c.backdropFilter, shadow: c.boxShadow.slice(0, 60), bg: c.backgroundColor };
  };
  const aside = document.querySelector("aside");
  return {
    card: cs(".card"),
    btn: cs(".btn-primary"),
    input: cs(".input"),
    aside: aside ? { bg: getComputedStyle(aside).backgroundColor, blur: getComputedStyle(aside).backdropFilter } : null,
    overflowDesktop: document.documentElement.scrollWidth > innerWidth,
  };
});
console.log(JSON.stringify(s, null, 2));
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:3456/planner", { waitUntil: "networkidle0" });
console.log("overflowMobile:", await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
console.log("mobileNavVisible:", await page.evaluate(() => !!document.querySelector("nav.fixed") && getComputedStyle(document.querySelector("nav.fixed")).display !== "none"));
await browser.close();
