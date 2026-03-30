import { defineConfig, devices } from '@playwright/test';

// Use staging URL in CI, localhost for local development
const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:5000';
const isCI = !!process.env.CI;
const isRemote = baseURL.startsWith('https://');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html']],
  timeout: 60000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: isCI,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],

  // Only start local server when not testing against remote URL
  ...(isRemote ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5000',
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
  }),
});