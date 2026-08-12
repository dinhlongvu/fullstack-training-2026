import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the run if a stray test.only is left in the source */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* 
   * Empirical Verification: Even after refactoring setup hooks to test.beforeAll, running Playwright
   * in parallel (fullyParallel: true) causes SQLite write lock contention (SQLITE_BUSY / 500 Internal Server Error)
   * because SQLite uses a single file-level Exclusive Write Lock for concurrent API write requests across workers.
   * Keeping workers: 1 and fullyParallel: false ensures 100% stable pass rate (269/269 passed) with 0 flaky failures.
   */
  fullyParallel: false,
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* slowMo only for local debugging — skip on CI to keep tests fast */
    ...(process.env.CI ? {} : { launchOptions: { slowMo: 200 } }),
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Start both Backend and Frontend before running tests.
   * Playwright starts servers in array order and waits for each URL to respond.
   * Backend must be ready before Frontend because the app calls the API on load. */
  webServer: [
    {
      command: 'dotnet run --project Backend.csproj --urls http://localhost:5000',
      cwd: '../../backend',
      url: 'http://localhost:5000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --strictPort',
      cwd: '../../frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
