import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const cli = ['node_modules/supabase/dist/supabase.js'];
function executar(comando, argumentos, entrada) {
  const r = spawnSync(comando, argumentos, { encoding: 'utf8', input: entrada, windowsHide: true });
  if (r.status !== 0) throw new Error('Preparação local falhou; verifique Docker e Supabase local. Saída omitida para proteger credenciais.');
  return r.stdout;
}
try {
  if (!readFileSync('supabase/config.toml', 'utf8').includes('project_id = "sistemaNR1"')) throw new Error('Projeto local inesperado.');
  executar(process.execPath, [...cli, 'start', '-x', 'storage-api,imgproxy,realtime,studio,edge-runtime,logflare,vector,supavisor']);
  const status = JSON.parse(executar(process.execPath, [...cli, 'status', '-o', 'json']));
  const conexao = new URL(status.DB_URL);
  if (status.API_URL !== 'http://127.0.0.1:55321' || conexao.hostname !== '127.0.0.1' || conexao.port !== '55322') throw new Error('Somente ambiente local isolado é permitido.');
  const senha = randomBytes(32).toString('hex');
  executar('docker', ['exec', '-i', 'supabase_db_sistemaNR1', 'psql', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'], `
    DO $papel$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='sistemanr1_runtime_e1') THEN
        CREATE ROLE sistemanr1_runtime_e1 LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
      END IF;
    END $papel$;
    ALTER ROLE sistemanr1_runtime_e1 PASSWORD '${senha}';
    GRANT sistemanr1_api TO sistemanr1_runtime_e1;
  `);
  conexao.username = 'sistemanr1_runtime_e1'; conexao.password = senha;
  mkdirSync('.e1', { recursive: true });
  writeFileSync('.e1/ambiente.local.json', JSON.stringify({
    SUPABASE_URL: status.API_URL, SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY || status.ANON_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY || status.SERVICE_ROLE_KEY,
    DATABASE_URL: conexao.toString(), MAILPIT_URL: status.INBUCKET_URL || 'http://127.0.0.1:55324'
  }), { mode: 0o600 });
  console.log('Ambiente de integração local preparado. Credenciais somente em arquivo ignorado; conexão restrita sem BYPASSRLS.');
} catch (erro) { console.error(erro.message); process.exitCode = 1; }
