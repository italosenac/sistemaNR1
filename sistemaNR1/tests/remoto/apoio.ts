import { expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ClientePg = {
  connection: { stream: { encrypted?: boolean; authorized?: boolean } };
  connect(): Promise<void>;
  query<T = Record<string, unknown>>(
    texto: string,
    valores?: unknown[],
  ): Promise<{ rows: T[] }>;
  end(): Promise<void>;
};
const requireApi = createRequire(resolve('apps/api/package.json'));
const { Client } = requireApi('pg') as {
  Client: new (opcoes: Record<string, unknown>) => ClientePg;
};
const ref = 'sfutycdmcjsvmfrvtxam';

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

const ambiente = lerAmbiente('apps/api/.env');
const navegador = lerAmbiente('apps/web/.env.local');
if (
  new URL(ambiente.SUPABASE_URL).hostname !== `${ref}.supabase.co` ||
  new URL(navegador.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${ref}.supabase.co`
)
  throw new Error('Projeto remoto inesperado.');

export const execucao =
  'E1REMOTO-' +
  new Date().toISOString().slice(0, 10) +
  '-' +
  randomBytes(4).toString('hex');
export const senha = randomBytes(24).toString('base64url') + 'aA1!';
export type Conta = { id: string; token: string; email: string };
const manifesto: {
  execucao: string;
  contas: { id: string; email: string }[];
  empresas: string[];
} = {
  execucao,
  contas: [],
  empresas: [],
};
function salvarManifesto() {
  writeFileSync('.e1/fixtures-remotas.local.json', JSON.stringify(manifesto), {
    mode: 0o600,
  });
}

export async function auth(caminho: string, corpo?: unknown, admin = false) {
  return fetch(ambiente.SUPABASE_URL + '/auth/v1' + caminho, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: {
      apikey: admin
        ? ambiente.SUPABASE_SECRET_KEY
        : ambiente.SUPABASE_PUBLISHABLE_KEY,
      ...(admin
        ? { Authorization: 'Bearer ' + ambiente.SUPABASE_SECRET_KEY }
        : {}),
      'Content-Type': 'application/json',
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

export async function criarConta(nome: string): Promise<Conta> {
  const email = `${nome.toLowerCase()}-${execucao.toLowerCase()}@example.invalid`;
  const criada = await auth(
    '/admin/generate_link',
    {
      type: 'signup',
      email,
      password: senha,
      data: { nome_completo: `Pessoa Fictícia ${nome}` },
      redirect_to: 'http://localhost:3200/auth/confirmacao',
    },
    true,
  );
  expect(criada.status, 'criação Auth isolada').toBe(200);
  const dados = (await criada.json()) as {
    id?: string;
    user?: { id?: string };
    hashed_token?: string;
  };
  const id = dados.id || dados.user?.id;
  expect(id).toBeTruthy();
  expect(dados.hashed_token).toBeTruthy();
  manifesto.contas.push({ id: id!, email });
  salvarManifesto();
  const confirmacao = await auth('/verify', {
    type: 'signup',
    token_hash: dados.hashed_token,
  });
  expect(confirmacao.status, 'confirmação Auth real').toBe(200);
  const login = await auth('/token?grant_type=password', {
    email,
    password: senha,
  });
  expect(login.status, 'autenticação Auth real').toBe(200);
  const sessao = (await login.json()) as {
    access_token: string;
    user: { id: string };
  };
  expect(sessao.user.id).toBe(id);
  return { id: id!, token: sessao.access_token, email };
}

export async function api<T>(
  ator: Conta | null,
  caminho: string,
  corpo?: unknown,
  esperado = corpo === undefined ? 200 : 201,
  metodo?: string,
): Promise<T> {
  const resposta = await fetch('http://localhost:3201/api/v1' + caminho, {
    method: metodo || (corpo === undefined ? 'GET' : 'POST'),
    headers: {
      ...(ator ? { Authorization: 'Bearer ' + ator.token } : {}),
      'Content-Type': 'application/json',
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
  expect(resposta.status, `HTTP ${caminho}`).toBe(esperado);
  return resposta.json() as Promise<T>;
}

export function registrarEmpresa(id: string) {
  manifesto.empresas.push(id);
  salvarManifesto();
}

export async function consultarRls(
  ator: Conta,
  empresaPropria: string,
  empresaExterna: string,
): Promise<{
  loginRestrito: boolean;
  tlsValidado: boolean;
  propria: number;
  externa: number;
}> {
  const url = new URL(ambiente.DATABASE_URL);
  const client = new Client({
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
  await client.connect();
  try {
    const tlsValidado =
      client.connection.stream.encrypted === true &&
      client.connection.stream.authorized === true;
    await client.query('BEGIN READ ONLY');
    await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
      ator.id,
    ]);
    const identidade = await client.query<{ usuario: string }>(
      'SELECT current_user AS usuario',
    );
    const empresas = await client.query<{ id: string }>(
      'SELECT id FROM organizacao.empresas WHERE id = ANY($1::uuid[])',
      [[empresaPropria, empresaExterna]],
    );
    return {
      loginRestrito: identidade.rows[0]?.usuario === 'sistemanr1_runtime_e1',
      tlsValidado,
      propria: empresas.rows.filter((linha) => linha.id === empresaPropria)
        .length,
      externa: empresas.rows.filter((linha) => linha.id === empresaExterna)
        .length,
    };
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    await client.end();
  }
}
