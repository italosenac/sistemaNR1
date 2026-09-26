import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const empresaA = '20000000-0000-4000-8000-000000000001';
const empresaB = '20000000-0000-4000-8000-000000000002';
const usuario = '10000000-0000-4000-8000-000000000001';
const estabelecimentoA = '40000000-0000-4000-8000-000000000001';
const estabelecimentoOutro = '40000000-0000-4000-8000-000000000002';
const setor = '50000000-0000-4000-8000-000000000001';
const senhaFicticia = 'Senha-Ficticia-2026';
const opcoes = {
  estabelecimentos: [
    { id: estabelecimentoA, nome: 'Unidade fictícia A' },
    { id: estabelecimentoOutro, nome: 'Unidade fictícia A2' },
  ],
  setores: [
    {
      id: setor,
      nome: 'Setor fictício A',
      estabelecimentoId: estabelecimentoA,
    },
  ],
  funcoes: [],
  turnos: [],
};

async function preparar(page: Page, gestor = true) {
  await page.route('http://127.0.0.1:54321/auth/v1/**', async (rota) => {
    if (rota.request().url().includes('/token')) {
      await rota.fulfill({
        json: {
          access_token: 'token-ficticio-de-teste',
          refresh_token: 'refresh-ficticio',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: usuario,
            aud: 'authenticated',
            role: 'authenticated',
            email: 'gestor@example.invalid',
            app_metadata: { provider: 'email' },
            user_metadata: {},
            created_at: '2026-09-26T00:00:00Z',
          },
        },
      });
    } else await rota.fulfill({ status: 204 });
  });
  await page.route('http://localhost:3101/api/v1/**', async (rota) => {
    const url = rota.request().url();
    if (url.endsWith('/minhas-empresas'))
      await rota.fulfill({
        json: gestor
          ? [
              { id: empresaA, nome: 'Empresa fictícia A', papel: 'gestor' },
              { id: empresaB, nome: 'Empresa fictícia B', papel: 'gestor' },
            ]
          : [],
      });
    else if (url.endsWith('/opcoes')) await rota.fulfill({ json: opcoes });
    else
      await rota.fulfill({
        status: 500,
        json: { codigo: 'SERVICO_INDISPONIVEL' },
      });
  });
  await page.goto('/usuarios');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('gestor@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill(senhaFicticia);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  if (gestor)
    await expect(
      page.getByRole('button', { name: 'Cadastrar usuário' }),
    ).toBeVisible();
}
async function preencher(page: Page) {
  await page
    .getByLabel('Nome completo', { exact: true })
    .fill('Pessoa Fictícia');
  await page
    .getByLabel('E-mail', { exact: true })
    .fill('pessoa@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill(senhaFicticia);
  await page.getByLabel('Matrícula funcional', { exact: true }).fill('001');
}

test('cadastro exibe os quatro campos, valida e não persiste senha no navegador', async ({
  page,
}) => {
  await preparar(page);
  await page.getByRole('button', { name: 'Cadastrar usuário' }).click();
  await expect(
    page.getByText('Informe o nome completo, de 3 a 150 caracteres.'),
  ).toBeVisible();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
  await expect(
    page.getByText('Use uma senha de 12 a 128 caracteres.'),
  ).toBeVisible();
  await expect(page.getByText('Informe a matrícula funcional.')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
});

test('envia cadastro à empresa selecionada, limpa senha e preserva anonimato na apresentação', async ({
  page,
}) => {
  await preparar(page);
  let recebido: Record<string, unknown> | undefined;
  await page.route(
    `http://localhost:3101/api/v1/empresas/${empresaA}/usuarios`,
    async (rota) => {
      recebido = rota.request().postDataJSON();
      await rota.fulfill({
        status: 201,
        json: {
          usuarioId: usuario,
          empresaId: empresaA,
          nomeCompleto: 'Pessoa Fictícia',
          matriculaFuncional: '001',
          papel: 'leitor',
        },
      });
    },
  );
  await preencher(page);
  await page.getByRole('button', { name: 'Cadastrar usuário' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Conta e vínculo cadastrados',
  );
  expect(recebido).toEqual({
    nomeCompleto: 'Pessoa Fictícia',
    email: 'pessoa@example.invalid',
    senha: senhaFicticia,
    matriculaFuncional: '001',
    papel: 'leitor',
  });
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await expect(
    page.getByText('Ele não identifica respostas aos questionários anônimos.', {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain(senhaFicticia);
});

test('trocar estabelecimento limpa setor e trocar empresa limpa todo o cadastro', async ({
  page,
}) => {
  await preparar(page);
  await preencher(page);
  await page
    .getByLabel('Estabelecimento', { exact: true })
    .selectOption(estabelecimentoA);
  await page.getByLabel('Setor', { exact: true }).selectOption(setor);
  await page
    .getByLabel('Estabelecimento', { exact: true })
    .selectOption(estabelecimentoOutro);
  await expect(page.getByLabel('Setor', { exact: true })).toHaveValue('');
  await page.getByLabel('Empresa', { exact: true }).selectOption(empresaB);
  await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue(
    '',
  );
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await expect(
    page.getByLabel('Matrícula funcional', { exact: true }),
  ).toHaveValue('');
});

test('vínculo existente envia matrícula da outra empresa sem e-mail/senha/nome', async ({
  page,
}) => {
  await preparar(page);
  await page.getByLabel('Empresa', { exact: true }).selectOption(empresaB);
  await expect(
    page.getByRole('button', { name: 'Cadastrar usuário' }),
  ).toBeVisible();
  await page.getByLabel('Tipo de cadastro').selectOption('existente');
  await page.getByLabel('Identificador da conta existente').fill(usuario);
  await page.getByLabel('Matrícula funcional', { exact: true }).fill('072');
  let recebido: Record<string, unknown> | undefined;
  await page.route(
    `http://localhost:3101/api/v1/empresas/${empresaB}/vinculos`,
    async (rota) => {
      recebido = rota.request().postDataJSON();
      await rota.fulfill({
        status: 201,
        json: {
          usuarioId: usuario,
          empresaId: empresaB,
          nomeCompleto: 'Pessoa Fictícia',
          matriculaFuncional: '072',
          papel: 'leitor',
        },
      });
    },
  );
  await page.getByRole('button', { name: 'Vincular usuário' }).click();
  await expect(page.getByRole('status')).toContainText(
    'sem alterar as credenciais',
  );
  expect(recebido).toEqual({
    usuarioId: usuario,
    matriculaFuncional: '072',
    papel: 'leitor',
  });
  await expect(page.getByLabel('Senha', { exact: true })).toHaveCount(0);
});

test('falha de cadastro mostra mensagem segura e limpa senha', async ({
  page,
}) => {
  await preparar(page);
  await preencher(page);
  await page.getByRole('button', { name: 'Cadastrar usuário' }).click();
  await expect(
    page
      .getByRole('region', { name: 'Cadastro de usuários' })
      .getByRole('alert'),
  ).toContainText('indisponível');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
});

test('usuário sem gestão não recebe formulário; página funciona em celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await preparar(page, false);
  await expect(page.getByRole('status')).toContainText(
    'não possui vínculo de gestão ativo',
  );
  await expect(
    page.getByRole('button', { name: 'Cadastrar usuário' }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
