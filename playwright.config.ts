import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5185",
    channel: "chrome",
    // Quizzes and exams require a camera; Chrome supplies a simulated one in tests.
    permissions: ["camera"],
    launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5185 --strictPort",
    url: "http://127.0.0.1:5185",
    reuseExistingServer: !process.env.CI,
  },
});
