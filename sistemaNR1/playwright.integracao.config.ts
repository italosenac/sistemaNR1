import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

const local: Record<string, string> = JSON.parse(
  readFileSync('.e1/ambiente.local.json', 'utf8'),
);
if (
  local.SUPABASE_URL !== 'http://127.0.0.1:55321' ||
  new URL(local.DATABASE_URL).port !== '55322'
)
  throw new Error(
    'Integração exige o Supabase local isolado nas portas 553xx.',
  );
export default defineConfig({
  testDir: './tests/integracao',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: './tests/integracao/relatorio-seguro.ts',
  outputDir: '.e1/resultados-integracao',
  use: {
    baseURL: 'http://localhost:3200',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'integracao-real',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.platform === 'win32' ? 'msedge' : 'chromium',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev:api',
      url: 'http://localhost:3201/health',
      timeout: 120000,
      reuseExistingServer: false,
      env: {
        ...local,
        NODE_ENV: 'development',
        PORT: '3201',
        FRONTEND_URL: 'http://localhost:3200',
      },
    },
    {
      command: 'pnpm --filter @sistemanr1/web exec next dev --port 3200',
      url: 'http://localhost:3200',
      timeout: 120000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'development',
        NEXT_DIST_DIR: '.next-integracao',
        NEXT_PUBLIC_API_URL: 'http://localhost:3201',
        NEXT_PUBLIC_SUPABASE_URL: local.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.SUPABASE_PUBLISHABLE_KEY,
      },
    },
  ],
});
