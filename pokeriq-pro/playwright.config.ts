import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for PokerIQ Pro
 * Comprehensive E2E testing setup with accessibility and performance testing
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Maximum test execution time
  timeout: 30 * 1000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Number of retry attempts
  retries: process.env.CI ? 2 : 0,
  
  // Number of workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Global test configuration
  use: {
    // Base URL for the app
    baseURL: process.env.BASE_URL || 'http://localhost:8820',
    
    // Browser context options
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Accessibility testing setup
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use authenticated state from setup
        storageState: 'test-results/auth.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'test-results/auth.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'test-results/auth.json',
      },
      dependencies: ['setup'],
    },
    
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'test-results/auth.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'test-results/auth.json',
      },
      dependencies: ['setup'],
    },
    
    // Accessibility testing project
    {
      name: 'accessibility',
      testDir: './e2e/accessibility',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/auth.json',
      },
      dependencies: ['setup'],
    },
    
    // Performance testing project
    {
      name: 'performance',
      testDir: './e2e/performance',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/auth.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Development server configuration
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:8820',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output directory for test artifacts
  outputDir: 'test-results/',
  
  // Global setup and teardown
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});