import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true, // Enable parallel execution for local development
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Retry on CI, no retries locally
  workers: process.env.CI ? 1 : undefined, // Use default workers locally
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html']],
  timeout: 60000, // 60 second timeout for local tests
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: !!process.env.CI, // Headless in CI, headed locally for debugging
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

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI, // Reuse existing server locally, start fresh in CI
    timeout: 120000, // Extended timeout for local development
  },
});