import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: './tests/playwright-report' }]],
  outputDir: './tests/test-results',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
