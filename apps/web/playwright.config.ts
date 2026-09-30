import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://arogyamesh.vercel.app",
    headless: true,
  },
  workers: 1,
  timeout: 120000,
  expect: { timeout: 20000 },
});
