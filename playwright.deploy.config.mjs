import { defineConfig } from "@playwright/test";

// D420-01 checks the live deployed site, not the local HTTP server.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "deploy-smoke.spec.mjs",
  fullyParallel: false,
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-deploy", open: "never" }]],
  outputDir: "test-results-deploy",
  use: {
    baseURL: "https://vietky.tdmdev.top",
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ignoreHTTPSErrors: false,
  },
  projects: [{ name: "deploy-chromium", use: { browserName: "chromium" } }],
});
