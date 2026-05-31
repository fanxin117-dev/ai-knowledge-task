import { defineConfig, devices } from "@playwright/test";

const shouldStartWebServer = process.env.PLAYWRIGHT_MANAGED_SERVER !== "0";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  reporter: "line",
  expect: {
    timeout: 20_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3020",
    trace: "on-first-retry",
  },
  webServer: shouldStartWebServer
    ? {
        command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3020",
        url: "http://127.0.0.1:3020",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      // 本机已经安装 Edge；直接复用系统浏览器可以避免首次运行时下载 Playwright 专用浏览器。
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
  ],
});
