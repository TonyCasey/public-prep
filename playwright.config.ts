import { defineConfig, devices } from '@playwright/test';

// Use staging URL in CI, localhost for local development
// Port 5173 = Vite dev server (proxies API to backend)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:5173';
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

  // WebServer config:
  // - Remote URL (staging/prod): No server needed, tests hit deployed app
  // - Local development: No webServer - run `npm run dev` in separate terminal
  // - CI with local URL: Start server (would need proper env setup)
  // Note: For local e2e testing, start server manually: `npm run dev`
});