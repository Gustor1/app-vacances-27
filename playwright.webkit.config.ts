import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', workers: 1, timeout: 30000, reporter: 'list',
  use: { ...devices['iPhone 13'], browserName: 'webkit', baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
