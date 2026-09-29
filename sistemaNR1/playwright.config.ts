import { defineConfig, devices } from '@playwright/test';

const portaWeb = process.env.E0_WEB_PORT ?? '3100';
const portaApi = process.env.E0_API_PORT ?? '3101';
const origemWeb = `http://localhost:${portaWeb}`;
const origemApi = `http://localhost:${portaApi}`;

const ambienteTeste = {
  NODE_ENV: 'development',
  PORT: portaApi,
  FRONTEND_URL: origemWeb,
  NEXT_PUBLIC_API_URL: origemApi,
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ficticia_para_testes',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ficticia_para_testes',
  SUPABASE_SECRET_KEY: '',
  DATABASE_URL: '',
};

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/integracao/**', '**/remoto/**'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: { baseURL: origemWeb, trace: 'retain-on-failure' },
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
      url: `${origemApi}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: ambienteTeste,
    },
    {
      command: `pnpm --filter @sistemanr1/web exec next dev --port ${portaWeb}`,
      url: origemWeb,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { ...ambienteTeste, NEXT_DIST_DIR: '.next-e2e' },
    },
  ],
});
