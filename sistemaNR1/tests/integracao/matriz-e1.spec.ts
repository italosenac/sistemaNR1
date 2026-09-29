import { expect, test } from '@playwright/test';
import type { Conta } from './apoio';
import { api, criarConta, sqlLocal, sufixo } from './apoio';

type Registro = {
  id: string;
  status: string;
  nome?: string;
  populacaoTotal?: number;
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

test.beforeAll(async () => {
  [gestorA, gestorB, trabalhador, tecnico, consultoria] = await Promise.all([
    criarConta('matriz-gestor-a'),
    criarConta('matriz-gestor-b'),
    criarConta('matriz-trabalhador'),
    criarConta('matriz-tecnico'),
    criarConta('matriz-consultoria'),
  ]);
  empresaA = (
    await api<Registro>(gestorA, '/empresas', {
      razaoSocial: 'Empresa Matriz A ' + sufixo,
    })
  ).id;
  empresaB = (
    await api<Registro>(gestorB, '/empresas', {
      razaoSocial: 'Empresa Matriz B ' + sufixo,
    })
  ).id;
  const associar = (ator: Conta, empresa: string, alvo: Conta, papel: string) =>
    api<Registro>(ator, `/empresas/${empresa}/vinculos`, {
      usuarioId: alvo.id,
      papeis: [papel],
      motivo: 'Matriz de permissões fictícia',
    });
  vinculoTrabalhador = (
    await associar(gestorA, empresaA, trabalhador, 'trabalhador')
  ).id;
  await associar(gestorA, empresaA, tecnico, 'responsavel_tecnico');
  await associar(gestorA, empresaA, consultoria, 'consultoria');
  await associar(gestorB, empresaB, gestorA, 'responsavel_tecnico');
});

test('matriz E1: identidade própria, gestão, papéis e fronteira empresarial', async () => {
  for (const ator of [gestorA, gestorB, trabalhador, tecnico, consultoria]) {
    expect((await api<Registro>(ator, '/meu-perfil')).id).toBe(ator.id);
    await api<Registro[]>(ator, '/meus-vinculos');
  }
  await api(
    trabalhador,
    '/meu-perfil',
    { nomeCompleto: 'Trabalhador Matriz Fictício' },
    200,
    'PATCH',
  );
  expect((await api<Registro>(trabalhador, '/meu-perfil')).id).toBe(
    trabalhador.id,
  );
  expect(
    (await api<Registro[]>(consultoria, '/minhas-empresas')).map((e) => e.id),
  ).toEqual([empresaA]);
  await api(consultoria, `/empresas/${empresaA}`);
  await api(consultoria, `/empresas/${empresaB}`, undefined, 403);
  await api(gestorA, `/empresas/${empresaB}/usuarios`, undefined, 403);
  await api(gestorB, `/empresas/${empresaA}/usuarios`, undefined, 403);
  expect(
    (await api<Registro[]>(gestorA, `/empresas/${empresaA}/usuarios`)).length,
  ).toBeGreaterThan(0);
  for (const ator of [trabalhador, tecnico, consultoria]) {
    await api(ator, `/empresas/${empresaA}/usuarios`, undefined, 403);
    await api(
      ator,
      `/empresas/${empresaA}/vinculos`,
      {
        usuarioId: gestorB.id,
        papeis: ['trabalhador'],
        motivo: 'Tentativa fictícia negada',
      },
      403,
    );
    await api(
      ator,
      `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}/lotacao`,
      {
        status: 'ativo',
      },
      403,
    );
  }
  await api(
    gestorA,
    `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}`,
    {
      matriculaFuncional: 'MAT-001',
      status: 'ativo',
    },
    200,
    'PATCH',
  );
  const papel = await api<Registro>(
    gestorA,
    `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}/papeis`,
    {
      papel: 'responsavel_tecnico',
      motivo: 'Concessão fictícia controlada',
    },
  );
  for (const ator of [trabalhador, tecnico, consultoria]) {
    await api(
      ator,
      `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}/papeis/${papel.id}/revogacao`,
      { motivo: 'Tentativa fictícia negada' },
      403,
    );
    await api(
      ator,
      `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}`,
      { status: 'inativo' },
      403,
      'PATCH',
    );
  }
  await api(
    trabalhador,
    `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}/papeis`,
    {
      papel: 'gestor_sst_rh',
      motivo: 'Autoelevação negada',
    },
    403,
  );
  await api(
    gestorA,
    `/empresas/${empresaA}/vinculos/${vinculoTrabalhador}/papeis/${papel.id}/revogacao`,
    {
      motivo: 'Revogação fictícia controlada',
    },
  );
  await api(
    trabalhador,
    `/empresas/${empresaA}/estrutura/estabelecimentos`,
    undefined,
    403,
  );
  const novaEmpresaTrabalhador = await api<Registro>(trabalhador, '/empresas', {
    razaoSocial: 'Empresa Bootstrap Trabalhador ' + sufixo,
  });
  expect(novaEmpresaTrabalhador.id).toBeTruthy();
  await api(trabalhador, `/empresas/${empresaA}/usuarios`, undefined, 403);
  await api(tecnico, `/empresas/${empresaA}/estrutura/estabelecimentos`);
  await api(
    consultoria,
    `/empresas/${empresaA}/estrutura/estabelecimentos`,
    undefined,
    403,
  );
  await api(gestorA, `/empresas/${empresaB}/estrutura/estabelecimentos`);
  await api(
    gestorA,
    `/empresas/${empresaB}/estrutura/funcoes`,
    { nome: 'Negada', status: 'ativo' },
    403,
  );
});

test('estrutura e lotação: edição, arquivamento, duplicidade e referências inválidas', async () => {
  const base = `/empresas/${empresaA}`;
  const criar = (tipo: string, dados: object) =>
    api<Registro>(gestorA, `${base}/estrutura/${tipo}`, {
      ...dados,
      status: 'ativo',
    });
  const unidade = await criar('estabelecimentos', { nome: 'Unidade Matriz' });
  const outraUnidade = await criar('estabelecimentos', {
    nome: 'Outra Unidade Matriz',
  });
  const setor = await criar('setores', {
    nome: 'Setor Matriz',
    estabelecimentoId: unidade.id,
  });
  const setorOutraUnidade = await criar('setores', {
    nome: 'Setor Outra Unidade',
    estabelecimentoId: outraUnidade.id,
  });
  const funcao = await criar('funcoes', { nome: 'Função Matriz' });
  const turno = await criar('turnos', {
    nome: 'Turno Matriz',
    horarioInicio: '22:00',
    horarioFim: '06:00',
  });
  const unidadeB = await api<Registro>(
    gestorB,
    `/empresas/${empresaB}/estrutura/estabelecimentos`,
    { nome: 'Unidade B', status: 'ativo' },
  );
  const setorB = await api<Registro>(
    gestorB,
    `/empresas/${empresaB}/estrutura/setores`,
    { nome: 'Setor B', estabelecimentoId: unidadeB.id, status: 'ativo' },
  );
  const funcaoB = await api<Registro>(
    gestorB,
    `/empresas/${empresaB}/estrutura/funcoes`,
    { nome: 'Função B', status: 'ativo' },
  );
  const turnoB = await api<Registro>(
    gestorB,
    `/empresas/${empresaB}/estrutura/turnos`,
    { nome: 'Turno B', status: 'ativo' },
  );
  const grupoDados = {
    nome: 'Grupo Matriz',
    estabelecimentoId: unidade.id,
    setorId: setor.id,
    funcaoId: funcao.id,
    turnoId: turno.id,
    quantidadeEstimadaTrabalhadores: 8,
    status: 'ativo',
  };
  const grupo = await api<Registro>(
    gestorA,
    `${base}/estrutura/grupos`,
    grupoDados,
  );
  await api(gestorA, `${base}/estrutura/grupos`, grupoDados, 409);
  for (const [tipo, dados] of [
    ['setores', { nome: 'Setor cruzado', estabelecimentoId: unidadeB.id }],
    ['grupos', { ...grupoDados, setorId: setorOutraUnidade.id }],
    ['grupos', { ...grupoDados, setorId: setorB.id }],
    ['grupos', { ...grupoDados, funcaoId: funcaoB.id }],
    ['grupos', { ...grupoDados, turnoId: turnoB.id }],
  ] as const)
    await api(
      gestorA,
      `${base}/estrutura/${tipo}`,
      { ...dados, status: 'ativo' },
      400,
    );
  const lotacao = {
    estabelecimentoId: unidade.id,
    setorId: setor.id,
    funcaoId: funcao.id,
    turnoId: turno.id,
    status: 'ativo',
  };
  await api(gestorA, `${base}/vinculos/${vinculoTrabalhador}/lotacao`, lotacao);
  for (const dados of [
    { ...lotacao, estabelecimentoId: unidadeB.id },
    { ...lotacao, setorId: setorB.id },
    { ...lotacao, funcaoId: funcaoB.id },
    { ...lotacao, turnoId: turnoB.id },
    { ...lotacao, setorId: setorOutraUnidade.id },
  ])
    await api(
      gestorA,
      `${base}/vinculos/${vinculoTrabalhador}/lotacao`,
      dados,
      400,
    );
  for (const ator of [trabalhador, tecnico, consultoria, gestorB]) {
    await api(
      ator,
      `${base}/estrutura/funcoes`,
      { nome: 'Sem capacidade', status: 'ativo' },
      403,
    );
    await api(
      ator,
      `${base}/estruturas-congeladas`,
      { estabelecimentoId: unidade.id },
      403,
    );
  }
  await api(
    gestorB,
    `${base}/estrutura/grupos/${grupo.id}`,
    { ...grupoDados, nome: 'Intrusão' },
    403,
    'PATCH',
  );
  const snapshot = await api<Registro>(
    gestorA,
    `${base}/estruturas-congeladas`,
    { estabelecimentoId: unidade.id },
  );
  expect(snapshot.populacaoTotal).toBe(8);
  expect(
    (await api<Registro[]>(tecnico, `${base}/estruturas-congeladas`)).some(
      (item) => item.id === snapshot.id,
    ),
  ).toBe(true);
  for (const ator of [trabalhador, consultoria])
    await api(ator, `${base}/estruturas-congeladas`, undefined, 403);
  const alteracoes = [
    [
      'grupos',
      grupo.id,
      { ...grupoDados, nome: 'Grupo Arquivado', status: 'inativo' },
    ],
    [
      'setores',
      setor.id,
      {
        nome: 'Setor Arquivado',
        estabelecimentoId: unidade.id,
        status: 'inativo',
      },
    ],
    ['funcoes', funcao.id, { nome: 'Função Arquivada', status: 'inativo' }],
    [
      'turnos',
      turno.id,
      {
        nome: 'Turno Arquivado',
        horarioInicio: '22:00',
        horarioFim: '06:00',
        status: 'inativo',
      },
    ],
    [
      'estabelecimentos',
      unidade.id,
      { nome: 'Unidade Arquivada', status: 'inativo' },
    ],
  ] as const;
  for (const [tipo, id, dados] of alteracoes)
    expect(
      (
        await api<Registro>(
          gestorA,
          `${base}/estrutura/${tipo}/${id}`,
          dados,
          200,
          'PATCH',
        )
      ).status,
    ).toBe('inativo');
  expect(
    (await api<Registro[]>(gestorA, `${base}/estruturas-congeladas`)).find(
      (s) => s.id === snapshot.id,
    )?.populacaoTotal,
  ).toBe(8);
  expect(
    sqlLocal(
      "SELECT has_table_privilege('sistemanr1_api','organizacao.estabelecimentos','DELETE')",
    ),
  ).toBe('f');
});

test('identificação profissional e auditoria: titular edita; outros não leem nem alteram', async () => {
  const caminho = '/meu-perfil/registros-profissionais';
  const registro = await api<Registro>(tecnico, caminho, {
    conselho: 'Conselho Fictício',
    numeroRegistro: 'FICT-001',
    uf: 'SP',
  });
  expect((await api<Registro[]>(tecnico, caminho)).map((r) => r.id)).toContain(
    registro.id,
  );
  expect(
    (await api<Registro[]>(trabalhador, caminho)).map((r) => r.id),
  ).not.toContain(registro.id);
  await api(
    tecnico,
    `${caminho}/${registro.id}`,
    {
      conselho: 'Conselho Fictício',
      numeroRegistro: 'FICT-002',
      uf: 'SP',
    },
    200,
    'PATCH',
  );
  await api(
    gestorA,
    `${caminho}/${registro.id}`,
    {
      conselho: 'Conselho Fictício',
      numeroRegistro: 'INDEVIDO',
      uf: 'SP',
    },
    404,
    'PATCH',
  );
  expect(
    sqlLocal(
      `SELECT count(*) FROM organizacao.eventos_auditoria WHERE entidade='identificacoes_profissionais' AND registro_id='${registro.id}' AND ator_id='${tecnico.id}'`,
    ),
  ).toBe('2');
  const contarEventos = (ator: Conta) =>
    Number(
      sqlLocal(
        `BEGIN; SET LOCAL ROLE sistemanr1_api; SET LOCAL "request.jwt.claim.sub"='${ator.id}'; SELECT count(*) FROM organizacao.eventos_auditoria WHERE empresa_id='${empresaA}'; ROLLBACK;`,
      ),
    );
  expect(contarEventos(gestorA)).toBeGreaterThan(0);
  expect(contarEventos(trabalhador)).toBe(0);
  expect(contarEventos(tecnico)).toBe(0);
  expect(contarEventos(consultoria)).toBe(0);
});
