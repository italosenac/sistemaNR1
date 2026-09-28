import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

function lerAmbiente(caminho: string): Record<string, string> {
  return Object.fromEntries(
    readFileSync(caminho, 'utf8')
      .split(/\r?\n/)
      .filter((linha) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(linha))
      .map((linha) => [
        linha.slice(0, linha.indexOf('=')),
        linha.slice(linha.indexOf('=') + 1),
      ]),
  );
}

const api = lerAmbiente('apps/api/.env');
const web = lerAmbiente('apps/web/.env.local');
const ref = 'sfutycdmcjsvmfrvtxam';
const banco = new URL(api.DATABASE_URL || 'postgresql://invalid.local');
if (
  new URL(api.SUPABASE_URL || 'http://invalid.local').hostname !==
    `${ref}.supabase.co` ||
  new URL(web.NEXT_PUBLIC_SUPABASE_URL || 'http://invalid.local').hostname !==
    `${ref}.supabase.co` ||
  banco.username !== `sistemanr1_runtime_e1.${ref}` ||
  banco.port !== '5432' ||
  banco.searchParams.get('sslmode') !== 'verify-full' ||
  !api.DATABASE_CA_CERT_PATH ||
  !api.SUPABASE_SECRET_KEY ||
  !web.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)
  throw new Error('Ambiente remoto E1 incompleto ou projeto divergente.');

export default defineConfig({
  testDir: './tests/remoto',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: './tests/remoto/relatorio-seguro.ts',
  outputDir: '.e1/resultados-remotos',
  use: {
    baseURL: 'http://localhost:3200',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'e1-remoto',
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
        ...api,
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
        NEXT_DIST_DIR: '.next-remoto',
        NEXT_PUBLIC_API_URL: 'http://localhost:3201',
        NEXT_PUBLIC_SUPABASE_URL: web.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          web.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
    },
  ],
});
