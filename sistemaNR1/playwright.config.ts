import { defineConfig, devices } from '@playwright/test';

const ambienteTeste = {
  NODE_ENV: 'development',
  PORT: '3101',
  FRONTEND_URL: 'http://localhost:3100',
  NEXT_PUBLIC_API_URL: 'http://localhost:3101',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ficticia_para_testes',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ficticia_para_testes',
  SUPABASE_SECRET_KEY: '',
  DATABASE_URL: '',
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.platform === 'win32' ? 'msedge' : 'chromium',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev:api',
      url: 'http://localhost:3101/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: ambienteTeste,
    },
    {
      command: 'pnpm --filter @sistemanr1/web exec next dev --port 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...ambienteTeste, NEXT_DIST_DIR: '.next-e2e' },
    },
  ],
});
