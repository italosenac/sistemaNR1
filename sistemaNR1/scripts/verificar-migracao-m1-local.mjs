import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const requireApi = createRequire(resolve('apps/api/package.json'));
const { Client } = requireApi('pg');
const ambiente = JSON.parse(readFileSync('.e1/ambiente.local.json', 'utf8'));
const endereco = new URL(ambiente.DATABASE_URL);
if (endereco.hostname !== '127.0.0.1' || endereco.port !== '55322')
  throw new Error('A verificação da migração M1 exige o PostgreSQL local isolado.');

const cliente = new Client({ connectionString: ambiente.DATABASE_URL, ssl: false });
const tabelas = [
  'campanhas',
  'grupos_campanha',
  'codigos',
  'respostas_protegidas',
  'registros_consulta',
];
try {
  await cliente.connect();
  const papeis = await cliente.query(`select current_user as usuario,
    not rolsuper and not rolbypassrls as restrito
    from pg_roles where rolname=current_user`);
  const linhas = await cliente.query(`select c.relname, c.relrowsecurity, c.relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='coleta' and c.relkind='r'`);
  const protegidas = tabelas.every((nome) =>
    linhas.rows.some(
      (linha) =>
        linha.relname === nome &&
        linha.relrowsecurity &&
        linha.relforcerowsecurity,
    ),
  );
  const acesso = await cliente.query(`select
    has_table_privilege(current_user,'coleta.codigos','SELECT') as codigos,
    has_table_privilege(current_user,'coleta.respostas_protegidas','SELECT') as respostas,
    has_table_privilege(current_user,'coleta.registros_consulta','SELECT') as taxas`);
  const colunas = await cliente.query(`select column_name from information_schema.columns
    where table_schema='coleta' and table_name='respostas_protegidas'`);
  const proibidas = ['usuario_id', 'matricula', 'email', 'nome', 'ip', 'hash_codigo'];
  const semIdentidade = proibidas.every(
    (nome) => !colunas.rows.some((coluna) => coluna.column_name === nome),
  );
  const aprovado =
    papeis.rows[0]?.restrito === true &&
    papeis.rows[0]?.usuario === 'sistemanr1_runtime_e1' &&
    protegidas &&
    !acesso.rows[0]?.codigos &&
    !acesso.rows[0]?.respostas &&
    !acesso.rows[0]?.taxas &&
    semIdentidade;
  console.log(
    JSON.stringify({
      aprovado,
      tabelasComRlsForcado: protegidas,
      leituraSensivelNegada:
        !acesso.rows[0]?.codigos &&
        !acesso.rows[0]?.respostas &&
        !acesso.rows[0]?.taxas,
      respostaSemIdentidade: semIdentidade,
    }),
  );
  if (!aprovado) process.exitCode = 1;
} catch {
  console.error('Verificação local M1 falhou; detalhes e credenciais omitidos.');
  process.exitCode = 1;
} finally {
  await cliente.end();
}
