import { defineConfig } from '@playwright/test';
import { chromiumTestOptions } from './scripts/browser-test-options';
const port = Number(process.env.DETOURS_TEST_PORT || 5173);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: 'planning-analysis.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: { baseURL, launchOptions: chromiumTestOptions(), screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: `npm run dev -- --port ${port} --strictPort`, url: baseURL, reuseExistingServer: !process.env.CI }
});
