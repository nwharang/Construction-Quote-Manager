import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Storage state path for authenticated tests
const storageStatePath = path.join(__dirname, 'tests/.auth/storage-state.json');

/**
 * Playwright configuration for Construction Quote Manager
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use */
  reporter: [['html', { open: 'never' }]],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - used for global setup
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Authenticated tests
    {
      name: 'chromium-auth',
      testMatch: /.*\.auth\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: storageStatePath,
      },
      dependencies: ['setup'],
    },
    
    // Unauthenticated tests - no need for auth setup
    {
      name: 'chromium',
      testMatch: /(?!.*\.auth\.spec\.ts).*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Mobile tests
    {
      name: 'Mobile Chrome',
      testMatch: /(?!.*\.auth\.spec\.ts).*\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
}); 