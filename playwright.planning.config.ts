import { defineConfig } from '@playwright/test';
import { chromiumTestOptions } from './scripts/browser-test-options';

// Isolated browser fixtures: never point this configuration at a real Supabase project.
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'planning-analysis.spec.ts', fullyParallel: false, workers: 1,
  timeout: 30_000, reporter: 'list', outputDir: 'test-results/planning-analysis',
  use: { baseURL: 'http://127.0.0.1:5175', launchOptions: chromiumTestOptions(), screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'https://planning-fake.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_planning_fixture',
      VITE_ENABLE_COLLABORATION: 'false', VITE_PLANNING_EXTRACTION_ENABLED: 'true' },
  },
});
