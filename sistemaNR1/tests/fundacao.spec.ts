import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';

const enderecoSaude = 'http://localhost:3101/health';

test('página consulta a API real e apresenta os módulos pendentes', async ({
  page,
  request,
}) => {
  await expect
    .poll(async () => {
      try {
        return (await request.get(enderecoSaude)).status();
      } catch {
        return 0;
      }
    })
    .toBe(200);
  expect(await (await request.get(enderecoSaude)).json()).toEqual({
    status: 'ok',
    servico: 'sistemaNR1-api',
  });
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SISNR1', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Gestão de riscos ocupacionais', { exact: true }),
  ).toBeVisible();
  for (const nome of ['M1 — Coleta', 'M2 — Avaliação', 'M3 — Inventário']) {
    await expect(page.getByRole('heading', { name: nome })).toBeVisible();
  }
  await expect(
    page.getByText('Ainda não implementado', { exact: true }),
  ).toHaveCount(3);
  await expect(page.getByRole('status')).toHaveText('API conectada');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  expect(erros).toEqual([]);
  await page.screenshot({
    path: 'test-results/e0-desktop.png',
    fullPage: true,
  });
});

test('falha de rede preserva a página e permite recuperação real', async ({
  page,
}) => {
  await page.route(enderecoSaude, (rota) => rota.abort('connectionrefused'));
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('API indisponível');
  const alertaDaConexao = page
    .getByRole('region', { name: 'Conexão com a API' })
    .getByRole('alert');
  await expect(alertaDaConexao).toContainText('A página continua disponível');
  await expect(
    page.getByText('Ainda não implementado', { exact: true }),
  ).toHaveCount(3);
  await page.unroute(enderecoSaude);
  await page.getByRole('button', { name: 'Verificar novamente' }).click();
  await expect(page.getByRole('status')).toHaveText('API conectada');
  await expect(alertaDaConexao).toHaveCount(0);
});

test('mostra carregamento enquanto aguarda a resposta', async ({ page }) => {
  let liberarResposta!: () => void;
  const aguardando = new Promise<void>((resolver) => {
    liberarResposta = resolver;
  });
  await page.route(enderecoSaude, async (rota) => {
    await aguardando;
    await rota.fulfill({ json: { status: 'ok', servico: 'sistemaNR1-api' } });
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Verificando conexão...');
  await expect(
    page.getByRole('button', { name: 'Verificar novamente' }),
  ).toBeDisabled();
  liberarResposta();
  await expect(page.getByRole('status')).toHaveText('API conectada');
});

for (const cenario of [
  {
    nome: 'erro HTTP',
    status: 503,
    json: { status: 'ok', servico: 'sistemaNR1-api' },
  },
  {
    nome: 'contrato inesperado',
    status: 200,
    json: { status: 'ok', servico: 'outro' },
  },
]) {
  test(`trata ${cenario.nome} como indisponibilidade`, async ({ page }) => {
    await page.route(enderecoSaude, (rota) =>
      rota.fulfill({ status: cenario.status, json: cenario.json }),
    );
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('API indisponível');
    await expect(
      page.getByRole('heading', { name: 'M1 — Coleta' }),
    ).toBeVisible();
  });
}

test('encerra espera excessiva e mantém a página utilizável', async ({
  page,
}) => {
  let requisicaoPendente: Route | undefined;
  await page.route(enderecoSaude, (rota) => {
    requisicaoPendente = rota;
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Verificando conexão...');
  await expect(page.getByRole('status')).toHaveText('API indisponível', {
    timeout: 8_000,
  });
  await expect(
    page.getByRole('button', { name: 'Verificar novamente' }),
  ).toBeEnabled();
  await requisicaoPendente?.abort('failed');
});

test('celular exibe os módulos e controles sem rolagem horizontal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('API conectada');
  await expect(
    page.getByRole('heading', { name: 'M3 — Inventário' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Verificar novamente' }).click();
  await expect(page.getByRole('status')).toHaveText('API conectada');
  await page.screenshot({
    path: 'test-results/e0-celular.png',
    fullPage: true,
  });
});
