import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { randomBytes, createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const ambiente: Record<string, string> = JSON.parse(
  readFileSync('.e1/ambiente.local.json', 'utf8'),
);
if (ambiente.SUPABASE_URL !== 'http://127.0.0.1:55321')
  throw new Error('Testes somente locais.');
export const sufixo = Date.now().toString(36);
export const senha = randomBytes(20).toString('hex');
export type Conta = { id: string; token: string; email: string };
export async function auth(
  caminho: string,
  corpo?: unknown,
  token?: string,
  admin = false,
) {
  return fetch(ambiente.SUPABASE_URL + '/auth/v1' + caminho, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: {
      apikey: admin
        ? ambiente.SUPABASE_SECRET_KEY
        : ambiente.SUPABASE_PUBLISHABLE_KEY,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      'Content-Type': 'application/json',
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}
export async function api<T = Record<string, unknown>>(
  conta: Conta | null,
  caminho: string,
  corpo?: unknown,
  esperado = corpo === undefined ? 200 : 201,
  metodo?: string,
): Promise<T> {
  const r = await fetch('http://localhost:3201/api/v1' + caminho, {
    method: metodo || (corpo === undefined ? 'GET' : 'POST'),
    headers: {
      ...(conta ? { Authorization: 'Bearer ' + conta.token } : {}),
      'Content-Type': 'application/json',
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
  expect(r.status, 'HTTP ' + caminho).toBe(esperado);
  return r.json() as Promise<T>;
}
export async function entrar(email: string, password = senha): Promise<Conta> {
  const r = await auth('/token?grant_type=password', { email, password });
  expect(r.status, 'Login real no Auth').toBe(200);
  const d = await r.json();
  return { id: d.user.id as string, token: d.access_token as string, email };
}
export async function criarConta(
  nome: string,
  semNome = false,
): Promise<Conta> {
  const email = nome + '-' + sufixo + '@example.invalid';
  // A API administrativa gera um link de teste. A confirmação usa /verify de verdade;
  // nenhuma conta é criada com email_confirm=true.
  const r = await auth(
    '/admin/generate_link',
    {
      type: 'signup',
      email,
      password: senha,
      data: semNome ? {} : { nome_completo: 'Pessoa Fictícia ' + nome },
    },
    undefined,
    true,
  );
  expect(r.status, 'Link local de confirmação').toBe(200);
  const d = await r.json();
  const confirmacao = await auth('/verify', {
    type: 'signup',
    token_hash: d.hashed_token,
  });
  expect(confirmacao.status, 'Confirmação real').toBe(200);
  return entrar(email);
}
export async function mensagem(email: string, tipo?: string): Promise<string> {
  let texto = '';
  await expect
    .poll(
      async () => {
        const r = await fetch(ambiente.MAILPIT_URL + '/api/v1/messages');
        const caixa = await r.json();
        for (const item of caixa.messages || []) {
          if (!item.To.some((t: { Address: string }) => t.Address === email))
            continue;
          const detalhe = await (
            await fetch(ambiente.MAILPIT_URL + '/api/v1/message/' + item.ID)
          ).json();
          const candidato: string = detalhe.HTML || detalhe.Text;
          if (candidato && (!tipo || candidato.includes('type=' + tipo))) {
            texto = candidato;
            return true;
          }
        }
        return false;
      },
      { message: 'Mensagem capturada apenas no Mailpit local' },
    )
    .toBe(true);
  const link = texto
    .match(/https?:\/\/[^\s"<>]+\/auth\/v1\/verify[^\s"<>]*/)?.[0]
    ?.replaceAll('&amp;', '&');
  if (!link) throw new Error('Link local ausente na mensagem de teste.');
  const u = new URL(link);
  if (!['127.0.0.1', 'localhost'].includes(u.hostname) || u.port !== '55321')
    throw new Error('Link externo bloqueado.');
  return link;
}
export async function fragmentoConfirmado(email: string, tipo?: string) {
  const r = await fetch(await mensagem(email, tipo), { redirect: 'manual' });
  expect(r.status, 'Verificação pelo link recebido').toBe(303);
  const destino = new URL(r.headers.get('location')!);
  const valores = new URLSearchParams(destino.hash.slice(1));
  expect(valores.has('access_token'), 'Sessão após confirmação').toBe(true);
  return destino.hash;
}
export async function confirmarEmail(email: string, tipo?: string) {
  return new URLSearchParams(
    (await fragmentoConfirmado(email, tipo)).slice(1),
  ).get('access_token')!;
}
export function sqlLocal(sql: string): string {
  const r = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_sistemaNR1',
      'psql',
      '-U',
      'supabase_admin',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-Atq',
    ],
    { encoding: 'utf8', input: sql, windowsHide: true },
  );
  if (r.status !== 0)
    throw new Error('Operação de fixture local falhou; dados omitidos.');
  return r.stdout.trim();
}
export function tokenLocal(
  id: string,
  alteracoes: Record<string, unknown> = {},
  outroProjeto = false,
): string {
  const r = spawnSync('docker', ['inspect', 'supabase_auth_sistemaNR1'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (r.status !== 0) throw new Error('Auth local indisponível.');
  const variaveis: string[] = JSON.parse(r.stdout)[0].Config.Env;
  const segredo = variaveis
    .find((v) => v.startsWith('GOTRUE_JWT_SECRET='))
    ?.slice('GOTRUE_JWT_SECRET='.length);
  if (!segredo)
    throw new Error(
      'Chave de assinatura local indisponível para teste de expiração.',
    );
  const codificar = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  const agora = Math.floor(Date.now() / 1000);
  const base =
    codificar({ alg: 'HS256', typ: 'JWT' }) +
    '.' +
    codificar({
      sub: id,
      aud: 'authenticated',
      role: 'authenticated',
      iss: ambiente.SUPABASE_URL + '/auth/v1',
      iat: agora,
      exp: agora + 3600,
      ...alteracoes,
    });
  return (
    base +
    '.' +
    createHmac('sha256', outroProjeto ? randomBytes(32) : segredo)
      .update(base)
      .digest('base64url')
  );
}
