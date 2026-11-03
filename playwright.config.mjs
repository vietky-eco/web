
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  reporter: "html",

  use: {
    baseURL: "http://127.0.0.1:4173",

    trace: "on-first-retry",

    screenshot: "only-on-failure"
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium"
      }
    }
  ],

  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
