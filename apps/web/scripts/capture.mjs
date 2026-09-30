import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:3100/command-center");
await page.getByText("Current stock appears healthy").waitFor();
await mkdir("../../docs/screenshots", { recursive: true });
await page.screenshot({
  path: "../../docs/screenshots/command-center.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "../../docs/screenshots/mobile.png",
  fullPage: true,
});
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth,
);
console.log(JSON.stringify({ mobileOverflow: overflow }));
await browser.close();
