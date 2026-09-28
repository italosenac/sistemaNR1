import { test, expect } from '@playwright/test';

test('questionário demonstrativo limpa o link e envia sem identidade nominal', async ({
  page,
}) => {
  const codigo = 'a'.repeat(64);
  let enviado = false;
  await page.route('**/api/v1/questionarios/respostas', async (rota) => {
    const corpo = rota.request().postDataJSON();
    expect(corpo).toEqual({
      codigo,
      sobrecargaPercebida: 1,
      ritmoPercebido: 2,
    });
    expect(rota.request().headers().authorization).toBeUndefined();
    enviado = true;
    await rota.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ recebida: true }),
    });
  });
  await page.goto('/questionario#codigo=' + codigo);
  await expect(page).toHaveURL(/\/questionario$/);
  await page
    .getByRole('group', { name: 'Como você percebe a carga de trabalho?' })
    .getByLabel('Baixo')
    .check();
  await page
    .getByRole('group', { name: 'Como você percebe o ritmo de trabalho?' })
    .getByLabel('Moderado')
    .check();
  await page.getByRole('button', { name: 'Enviar resposta' }).click();
  await expect(page.getByText('Resposta recebida')).toBeVisible();
  expect(enviado).toBe(true);
});
