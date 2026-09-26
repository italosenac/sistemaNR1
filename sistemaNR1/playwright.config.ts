import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{
    name: 'desktop',
    use: { ...devices['Desktop Chrome'], channel: process.platform === 'win32' ? 'msedge' : 'chromium' },
  }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NODE_ENV: 'development', PORT: '3001', FRONTEND_URL: 'http://localhost:3000', NEXT_PUBLIC_API_URL: 'http://localhost:3001' },
  },
});
