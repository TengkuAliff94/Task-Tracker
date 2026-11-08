import { defineConfig, devices } from '@playwright/test'

// Override with E2E_PORT to run several checkouts side by side without reusing each other's server.
const PORT = Number(process.env.E2E_PORT ?? 4173)

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The HTML report always goes to playwright-report/ (CI uploads it when a run fails).
  reporter: [[process.env.CI ? 'github' : 'list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    locale: 'en-GB',
    timezoneId: 'Asia/Kuala_Lumpur',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /screenshots\.spec\.ts/ },
    // Only runs when asked for (`npm run screenshots`); regenerates the README images.
    // Reduced motion so every shot shows final states: the screenshot option `animations: 'disabled'`
    // only stops CSS animations, not the JavaScript-driven ones from Motion.
    {
      name: 'screenshots',
      testMatch: /screenshots\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
