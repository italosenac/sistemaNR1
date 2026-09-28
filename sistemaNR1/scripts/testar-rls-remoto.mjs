import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const requireApi = createRequire(resolve('apps/api/package.json'));
const { Client } = requireApi('pg');
const ref = 'sfutycdmcjsvmfrvtxam';
const manifesto = JSON.parse(
  readFileSync('.e1/fixtures-remotas.local.json', 'utf8'),
);
const ambiente = Object.fromEntries(
  readFileSync('apps/api/.env', 'utf8')
    .split(/\r?\n/)
    .filter((linha) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(linha))
    .map((linha) => [
      linha.slice(0, linha.indexOf('=')),
      linha.slice(linha.indexOf('=') + 1),
    ]),
);
const url = new URL(ambiente.DATABASE_URL);
if (
  !manifesto.execucao?.startsWith('E1REMOTO-') ||
  manifesto.contas?.length !== 5 ||
  manifesto.empresas?.length !== 2 ||
  url.username !== `sistemanr1_runtime_e1.${ref}` ||
  !/^aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname)
)
  throw new Error('Pré-condições de fixture e projeto não atendidas.');

const cliente = new Client({
  host: url.hostname,
  port: Number(url.port),
  database: url.pathname.slice(1),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  ssl: {
    ca: readFileSync(ambiente.DATABASE_CA_CERT_PATH, 'utf8'),
    rejectUnauthorized: true,
    servername: url.hostname,
  },
  connectionTimeoutMillis: 10000,
});
let conexao = false;
try {
  await cliente.connect();
  conexao = true;
  if (cliente.connection.stream.authorized !== true)
    throw new Error('TLS do cliente não validado.');
  await cliente.query('BEGIN');
  await cliente.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
    manifesto.contas[0].id,
  ]);
  const [propria, externa] = manifesto.empresas;
  const leitura = await cliente.query(
    'SELECT id FROM organizacao.empresas WHERE id = ANY($1::uuid[])',
    [[propria, externa]],
  );
  const leituraIsolada =
    leitura.rows.length === 1 && leitura.rows[0].id === propria;
  await cliente.query('SAVEPOINT negativa');
  let escritaExternaBloqueada = false;
  try {
    const alteracao = await cliente.query(
      'UPDATE organizacao.empresas SET razao_social = razao_social WHERE id=$1 RETURNING id',
      [externa],
    );
    escritaExternaBloqueada = alteracao.rows.length === 0;
  } catch (erro) {
    escritaExternaBloqueada = erro?.code === '42501';
  } finally {
    await cliente.query('ROLLBACK TO SAVEPOINT negativa');
  }
  await cliente.query('ROLLBACK');
  console.log(
    JSON.stringify({
      tlsClienteValidado: true,
      leituraIsolada,
      escritaExternaBloqueada,
      transacaoRevertida: true,
    }),
  );
  if (!leituraIsolada || !escritaExternaBloqueada) process.exitCode = 1;
} catch (erro) {
  console.log(
    JSON.stringify({
      etapa: 'rls_remoto',
      resultado: 'falhou',
      codigo: /^[A-Z0-9_]{2,40}$/.test(erro?.code || '')
        ? erro.code
        : 'SEM_CODIGO',
    }),
  );
  process.exitCode = 1;
} finally {
  if (conexao) {
    await cliente.query('ROLLBACK').catch(() => {});
    await cliente.end().catch(() => {});
  }
}
