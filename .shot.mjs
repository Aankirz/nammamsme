import { chromium } from "playwright";

const tag = process.argv[2] ?? "shot";
const widths = [1440, 1280, 1024];
const dir = "/private/tmp/claude-501/-Users-ankitkiran-Desktop-nammamsme/0f694f67-ac52-4192-9501-d082ba6e730f/scratchpad";

const browser = await chromium.launch();
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/${tag}-${width}.png`, fullPage: true });
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  console.log(width, JSON.stringify(overflow), overflow.scrollW > overflow.clientW ? "H-SCROLL" : "ok");
  await page.close();
}
await browser.close();
