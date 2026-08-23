import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 430, height: 920 } });
page.on("console", (m) => console.log("CONSOLE", m.type(), m.text()));
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await page.goto("http://127.0.0.1:8080/experience", {
  waitUntil: "networkidle",
  timeout: 30000,
});
await page.waitForTimeout(3000);
console.log("articles", await page.locator("article").allInnerTexts());
console.log("forms", await page.locator("form").count());
console.log("inputs", await page.locator("input[type=password]").count());
await page.screenshot({
  path: "/workspace/screenshots/experience-private-full.png",
  fullPage: true,
});
await browser.close();
