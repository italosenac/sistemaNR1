import { test, expect } from '@playwright/test';
import type { Conta } from './apoio';
import {
  api,
  auth,
  consultarRls,
  criarConta,
  execucao,
  registrarEmpresa,
  senha,
} from './apoio';

type Registro = {
  id: string;
  usuarioId?: string;
  empresaId?: string;
  nomeCompleto?: string;
  matriculaFuncional?: string | null;
  papeis?: string[];
};

test.describe.configure({ mode: 'serial' });
let gestorA: Conta;
let gestorB: Conta;
let trabalhador: Conta;
let tecnico: Conta;
let consultoria: Conta;
let empresaA: string;
let empresaB: string;
let vinculoTrabalhador: string;
let vinculoConsultoria: string;

test('Auth remoto: signup por link de fixture, confirmação, login e perfis', async () => {
  gestorA = await criarConta('GestorA');
  gestorB = await criarConta('GestorB');
  trabalhador = await criarConta('Trabalhador');
  tecnico = await criarConta('Tecnico');
  consultoria = await criarConta('Consultoria');
  const perfil = await api<Registro>(gestorA, '/meu-perfil');
  expect(perfil.nomeCompleto).toBe('Pessoa Fictícia GestorA');
  await api(gestorA, '/meu-perfil', undefined, 200);
  await api(null, '/meu-perfil', undefined, 401);
  await api(
    { ...gestorA, token: 'token-ficticio-invalido' },
    '/meu-perfil',
    undefined,
    401,
  );
  const incorreta = await auth('/token?grant_type=password', {
    email: gestorA.email,
    password: 'senha-ficticia-incorreta',
  });
  expect(incorreta.status).toBe(400);
});

test('empresas fictícias, quatro perfis, vínculos e matrículas multiempresa', async () => {
  empresaA = (
    await api<Registro>(gestorA, '/empresas', {
      razaoSocial: `Empresa Fictícia ${execucao} A`,
    })
  ).id;
  registrarEmpresa(empresaA);
  empresaB = (
    await api<Registro>(gestorB, '/empresas', {
      razaoSocial: `Empresa Fictícia ${execucao} B`,
    })
  ).id;
  registrarEmpresa(empresaB);
  const vincular = (
    gestor: Conta,
    empresa: string,
    pessoa: Conta,
    papeis: string[],
    matriculaFuncional?: string,
  ) =>
    api<Registro>(gestor, `/empresas/${empresa}/vinculos`, {
      usuarioId: pessoa.id,
      papeis,
      matriculaFuncional,
      motivo: `Fixture fictícia ${execucao}`,
    });
  vinculoTrabalhador = (
    await vincular(gestorA, empresaA, trabalhador, ['trabalhador'], 'REM-A-001')
  ).id;
  await vincular(gestorB, empresaB, trabalhador, ['trabalhador'], 'REM-B-009');
  await vincular(gestorA, empresaA, tecnico, ['responsavel_tecnico']);
  vinculoConsultoria = (
    await vincular(gestorA, empresaA, consultoria, ['consultoria'])
  ).id;
  await vincular(gestorB, empresaB, consultoria, ['consultoria']);
  const vinculos = await api<Registro[]>(trabalhador, '/meus-vinculos');
  expect(vinculos.map((v) => v.matriculaFuncional).sort()).toEqual([
    'REM-A-001',
    'REM-B-009',
  ]);
  expect((await api<Registro[]>(consultoria, '/minhas-empresas')).length).toBe(
    2,
  );
  await api(gestorA, `/empresas/${empresaB}`, undefined, 403);
  for (const pessoa of [trabalhador, tecnico, consultoria])
    await api(pessoa, `/empresas/${empresaA}/usuarios`, undefined, 403);
});

test('estrutura, lotação, isolamento e referências entre empresas', async () => {
  const unidadeA = (
    await api<Registro>(
      gestorA,
      `/empresas/${empresaA}/estrutura/estabelecimentos`,
      {
        nome: `Unidade Remota ${execucao}`,
        status: 'ativo',
      },
    )
  ).id;
  const setorA = (
    await api<Registro>(gestorA, `/empresas/${empresaA}/estrutura/setores`, {
      nome: `Setor Remoto ${execucao}`,
      estabelecimentoId: unidadeA,
      status: 'ativo',
    })
  ).id;
  const funcaoA = (
    await api<Registro>(gestorA, `/empresas/${empresaA}/estrutura/funcoes`, {
      nome: `Função Remota ${execucao}`,
      status: 'ativo',
    })
  ).id;
  const turnoA = (
    await api<Registro>(gestorA, `/empresas/${empresaA}/estrutura/turnos`, {
      nome: `Turno Remoto ${execucao}`,
      horarioInicio: '08:00',
      horarioFim: '17:00',
      status: 'ativo',
    })
  ).id;
  await api(
    gestorA,
    `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}/lotacao`,
    {
      estabelecimentoId: unidadeA,
      setorId: setorA,
      funcaoId: funcaoA,
      turnoId: turnoA,
      status: 'ativo',
    },
  );
  const unidadeB = (
    await api<Registro>(
      gestorB,
      `/empresas/${empresaB}/estrutura/estabelecimentos`,
      {
        nome: `Unidade Externa ${execucao}`,
        status: 'ativo',
      },
    )
  ).id;
  await api(
    gestorA,
    `/empresas/${empresaA}/estrutura/setores`,
    {
      nome: 'Referência cruzada bloqueada',
      estabelecimentoId: unidadeB,
      status: 'ativo',
    },
    400,
  );
  await api(
    gestorB,
    `/empresas/${empresaA}/estrutura/estabelecimentos`,
    undefined,
    403,
  );
  expect((await api<Registro[]>(trabalhador, '/meus-vinculos')).length).toBe(2);
});

test('autorização, revogação imediata e RLS no login restrito', async () => {
  const base = `/empresas/${empresaA}/vinculos/${vinculoConsultoria}`;
  await api(
    consultoria,
    `/empresas/${empresaA}/estrutura/setores`,
    undefined,
    403,
  );
  const papel = await api<Registro>(gestorA, `${base}/papeis`, {
    papel: 'responsavel_tecnico',
    motivo: `Concessão fictícia ${execucao}`,
  });
  expect(
    (
      await api<Registro[]>(
        consultoria,
        `/empresas/${empresaA}/estrutura/setores`,
      )
    ).length,
  ).toBe(1);
  await api(gestorA, `${base}/papeis/${papel.id}/revogacao`, {
    motivo: `Revogação fictícia ${execucao}`,
  });
  await api(
    consultoria,
    `/empresas/${empresaA}/estrutura/setores`,
    undefined,
    403,
  );
  const rls = await consultarRls(gestorA, empresaA, empresaB);
  expect(rls).toEqual({
    loginRestrito: true,
    tlsValidado: true,
    propria: 1,
    externa: 0,
  });
});

test('Next.js → NestJS → Supabase no navegador real', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(gestorA.email);
  await page.getByLabel('Senha', { exact: true }).fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Meu perfil', exact: true }).click();
  await expect(page.getByLabel('Nome completo')).toHaveValue(
    'Pessoa Fictícia GestorA',
  );
  await page
    .getByRole('link', { name: 'Estabelecimentos', exact: true })
    .click();
  await expect(
    page.getByText(`Unidade Remota ${execucao}`, { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Entrar', exact: true }),
  ).toBeVisible();
});
