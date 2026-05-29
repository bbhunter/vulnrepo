import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['VULNREPO_E2E_PORT'] ?? 4200);
const BASE_URL = process.env['VULNREPO_E2E_BASE_URL'] ?? `http://localhost:${PORT}`;
const REUSE_SERVER = !process.env['CI'];

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: REUSE_SERVER,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
