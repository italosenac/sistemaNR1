import { test, expect } from '@playwright/test';
import type { Conta } from './apoio';
import {
  ambiente,
  api,
  auth,
  confirmarEmail,
  criarConta,
  entrar,
  fragmentoConfirmado,
  senha,
  sqlLocal,
  sufixo,
  tokenLocal,
} from './apoio';
type Registro = {
  id: string;
  status: string;
  matriculaFuncional: string | null;
  papeis: string[];
  nomeCompleto: string;
  populacaoTotal: number;
  revisao: number;
  nome: string;
  capacidades: string[];
};
test.describe.configure({ mode: 'serial' });
let gestor: Conta,
  outro: Conta,
  trabalhador: Conta,
  tecnico: Conta,
  consultoria: Conta;
let a: string,
  b: string,
  unidade: string,
  setor: string,
  funcao: string,
  turno: string,
  grupo: string,
  vinculoTrabalhador: string,
  vinculoConsultoria: string;

test('Auth real: cadastro, e-mail, senha incorreta, token inválido/expirado e ausência de autenticação', async () => {
  const email = 'cadastro-' + sufixo + '@example.invalid';
  expect(
    (await auth('/signup', { email: 'invalido', password: senha })).status,
  ).toBe(400);
  const r = await auth('/signup', {
    email,
    password: senha,
    data: { nome_completo: 'Gestor Fictício' },
  });
  expect(r.status).toBe(200);
  const novo = await r.json();
  expect(Boolean(novo.access_token)).toBe(false);
  expect(
    (await auth('/token?grant_type=password', { email, password: senha }))
      .status,
  ).toBe(400);
  await confirmarEmail(email);
  gestor = await entrar(email);
  expect(
    (
      await auth('/token?grant_type=password', {
        email,
        password: 'senha-incorreta-ficticia',
      })
    ).status,
  ).toBe(400);
  await api(null, '/meu-perfil', undefined, 401);
  await api(
    { ...gestor, token: 'token-invalido' },
    '/meu-perfil',
    undefined,
    401,
  );
  await api(
    { ...gestor, token: tokenLocal(gestor.id, { iat: 1, exp: 2 }) },
    '/meu-perfil',
    undefined,
    401,
  );
  await api(
    { ...gestor, token: tokenLocal(gestor.id, { aud: 'outra-audiencia' }) },
    '/meu-perfil',
    undefined,
    401,
  );
  await api(
    {
      ...gestor,
      token: tokenLocal(gestor.id, {
        iss: 'https://outro.example.invalid/auth/v1',
      }),
    },
    '/meu-perfil',
    undefined,
    401,
  );
  await api(
    { ...gestor, token: tokenLocal(gestor.id, {}, true) },
    '/meu-perfil',
    undefined,
    401,
  );
  expect((await api<Registro>(gestor, '/meu-perfil')).nomeCompleto).toBe(
    'Gestor Fictício',
  );
  expect((await api<unknown[]>(gestor, '/minhas-empresas')).length).toBe(0);
  await api(
    gestor,
    '/meu-perfil',
    { nomeCompleto: 'Gestor Fictício Atualizado' },
    200,
    'PATCH',
  );
  await api(
    gestor,
    '/meu-perfil',
    { nomeCompleto: 'Gestor Fictício', status: 'ativo' },
    400,
    'PATCH',
  );
  outro = await criarConta('outro');
  trabalhador = await criarConta('trabalhador');
  tecnico = await criarConta('tecnico');
  consultoria = await criarConta('consultoria');
});

test('bootstrap atômico e associações autorizadas em duas empresas com matrículas opcionais', async () => {
  await api(
    gestor,
    '/empresas',
    { razaoSocial: 'Empresa inválida', cnpj: '11111111111111' },
    400,
  );
  a = (
    await api<Registro>(gestor, '/empresas', {
      razaoSocial: 'Empresa Fictícia A ' + sufixo,
    })
  ).id;
  b = (
    await api<Registro>(outro, '/empresas', {
      razaoSocial: 'Empresa Fictícia B ' + sufixo,
    })
  ).id;
  const proprio = (await api<Registro[]>(gestor, '/meus-vinculos'))[0];
  expect(proprio.matriculaFuncional).toBeNull();
  expect(proprio.papeis).toEqual(['gestor_sst_rh']);
  await api(
    gestor,
    '/empresas/' + a + '/vinculos/' + proprio.id + '/papeis',
    { papel: 'responsavel_tecnico', motivo: 'Autopromoção proibida' },
    403,
  );
  await api(gestor, '/empresas/' + b, undefined, 403);
  await api(
    trabalhador,
    '/empresas/' + a + '/vinculos',
    {
      usuarioId: trabalhador.id,
      papeis: ['gestor_sst_rh'],
      motivo: 'Tentativa sem acesso',
    },
    403,
  );
  const associar = (
    ator: Conta,
    empresa: string,
    conta: Conta,
    papeis: string[],
    matriculaFuncional?: string,
  ) =>
    api<Registro>(ator, '/empresas/' + empresa + '/vinculos', {
      usuarioId: conta.id,
      papeis,
      motivo: 'Associação fictícia autorizada',
      matriculaFuncional,
    });
  vinculoTrabalhador = (
    await associar(gestor, a, trabalhador, ['trabalhador'], ' A-001 ')
  ).id;
  await associar(outro, b, trabalhador, ['trabalhador'], 'B-009');
  await associar(gestor, a, tecnico, ['responsavel_tecnico']);
  vinculoConsultoria = (await associar(gestor, a, consultoria, ['consultoria']))
    .id;
  await associar(outro, b, consultoria, ['consultoria']);
  await api(
    gestor,
    '/empresas/' + a + '/vinculos',
    {
      usuarioId: outro.id,
      papeis: ['trabalhador'],
      matriculaFuncional: 'a-001',
      motivo: 'Duplicação rejeitada',
    },
    409,
  );
  const vinculos = await api<Registro[]>(trabalhador, '/meus-vinculos');
  expect(vinculos.map((v) => v.matriculaFuncional).sort()).toEqual([
    'A-001',
    'B-009',
  ]);
  expect((await api<Registro[]>(consultoria, '/minhas-empresas')).length).toBe(
    2,
  );
  for (const pessoa of [trabalhador, tecnico, consultoria])
    await api(pessoa, '/empresas/' + a + '/usuarios', undefined, 403);
  await api(
    consultoria,
    '/empresas/' + a + '/estrutura/estabelecimentos',
    undefined,
    403,
  );
  expect(
    (
      await api<Registro[]>(
        tecnico,
        '/empresas/' + a + '/estrutura/estabelecimentos',
      )
    ).length,
  ).toBe(0);
});

test('estrutura, lotação, referências cruzadas, sobreposição e fotografia persistida', async () => {
  const base = '/empresas/' + a;
  const estrutura = async (tipo: string, dados: object) =>
    api<Registro>(gestor, base + '/estrutura/' + tipo, {
      status: 'ativo',
      ...dados,
    });
  unidade = (
    await estrutura('estabelecimentos', {
      nome: 'Unidade A',
      caracterizacaoAmbiente: 'Ambiente sintético',
    })
  ).id;
  setor = (
    await estrutura('setores', { nome: 'Setor A', estabelecimentoId: unidade })
  ).id;
  funcao = (await estrutura('funcoes', { nome: 'Função A' })).id;
  turno = (
    await estrutura('turnos', {
      nome: 'Noturno A',
      horarioInicio: '22:00',
      horarioFim: '06:00',
    })
  ).id;
  const dadosGrupo = {
    nome: 'Grupo A',
    estabelecimentoId: unidade,
    setorId: setor,
    funcaoId: funcao,
    turnoId: turno,
    quantidadeEstimadaTrabalhadores: 10,
  };
  grupo = (await estrutura('grupos', dadosGrupo)).id;
  await api(
    gestor,
    base + '/estrutura/grupos',
    { ...dadosGrupo, status: 'ativo' },
    409,
  );
  const externa = (
    await api<Registro>(
      outro,
      '/empresas/' + b + '/estrutura/estabelecimentos',
      { nome: 'Unidade B', status: 'ativo' },
    )
  ).id;
  await api(
    gestor,
    base + '/estrutura/setores',
    { nome: 'Cruzado', estabelecimentoId: externa, status: 'ativo' },
    400,
  );
  const setorExterno = (
    await api<Registro>(outro, '/empresas/' + b + '/estrutura/setores', {
      nome: 'Setor B',
      estabelecimentoId: externa,
      status: 'ativo',
    })
  ).id;
  await api(
    gestor,
    base + '/estrutura/grupos',
    {
      ...dadosGrupo,
      estabelecimentoId: externa,
      setorId: setorExterno,
      status: 'ativo',
    },
    400,
  );
  await api(
    outro,
    base + '/estrutura/funcoes/' + funcao,
    { nome: 'Intrusão', status: 'ativo' },
    403,
    'PATCH',
  );
  const outraUnidade = (
    await estrutura('estabelecimentos', { nome: 'Outra unidade A' })
  ).id;
  const lotacao = {
    estabelecimentoId: unidade,
    setorId: setor,
    funcaoId: funcao,
    turnoId: turno,
    status: 'ativo',
  };
  await api(
    gestor,
    base + '/vinculos/' + vinculoTrabalhador + '/lotacao',
    { ...lotacao, estabelecimentoId: outraUnidade },
    400,
  );
  await api(
    gestor,
    base + '/vinculos/' + vinculoTrabalhador + '/lotacao',
    lotacao,
  );
  const congelada = await api<Registro>(
    gestor,
    base + '/estruturas-congeladas',
    { estabelecimentoId: unidade },
  );
  expect(congelada.populacaoTotal).toBe(10);
  await api(
    gestor,
    base + '/estrutura/grupos/' + grupo,
    { ...dadosGrupo, quantidadeEstimadaTrabalhadores: 12, status: 'ativo' },
    200,
    'PATCH',
  );
  expect(
    (await api<Registro[]>(gestor, base + '/estruturas-congeladas'))[0]
      .populacaoTotal,
  ).toBe(10);
  const concorrentes = await Promise.all(
    [1, 2].map(() =>
      api<Registro>(gestor, base + '/estruturas-congeladas', {
        estabelecimentoId: unidade,
      }),
    ),
  );
  expect(concorrentes.map((c) => c.revisao).sort()).toEqual([2, 3]);
  expect(
    sqlLocal(
      "SELECT count(*) FROM organizacao.estruturas_congeladas WHERE empresa_id='" +
        a +
        "'",
    ),
  ).toBe('3');
});

test('papéis e vínculos revogados surtem efeito com o mesmo JWT; Data API não expõe autopromoção', async () => {
  const base = '/empresas/' + a + '/vinculos/' + vinculoConsultoria;
  const atribuicao = await api<Registro>(gestor, base + '/papeis', {
    papel: 'responsavel_tecnico',
    motivo: 'Atuação técnica fictícia',
  });
  await api(
    gestor,
    base + '/papeis',
    { papel: 'responsavel_tecnico', motivo: 'Repetição rejeitada' },
    409,
  );
  expect(
    (
      await api<Registro[]>(
        consultoria,
        '/empresas/' + a + '/estrutura/setores',
      )
    ).length,
  ).toBe(1);
  await api(gestor, base + '/papeis/' + atribuicao.id + '/revogacao', {
    motivo: 'Encerramento fictício',
  });
  await api(
    consultoria,
    '/empresas/' + a + '/estrutura/setores',
    undefined,
    403,
  );
  await api(
    gestor,
    base,
    { status: 'inativo', matriculaFuncional: null },
    200,
    'PATCH',
  );
  expect(
    (await api<Registro[]>(consultoria, '/minhas-empresas')).map((e) => e.id),
  ).toEqual([b]);
  await api(consultoria, '/empresas/' + a, undefined, 403);
  const r = await fetch(ambiente.SUPABASE_URL + '/rest/v1/atribuicoes_papel', {
    method: 'POST',
    headers: {
      apikey: ambiente.SUPABASE_PUBLISHABLE_KEY,
      Authorization: 'Bearer ' + trabalhador.token,
      'Content-Type': 'application/json',
      'Content-Profile': 'organizacao',
    },
    body: JSON.stringify({ papel: 'gestor_sst_rh' }),
  });
  expect(r.status).toBe(406);
});

test('cadastro parcial e conta anterior sem perfil são reconciliados sem ganhar acesso; conta inativa é bloqueada', async () => {
  const parcial = await criarConta('parcial', true);
  expect((await api<Registro>(parcial, '/meu-perfil')).status).toBe('pendente');
  await api(parcial, '/empresas', { razaoSocial: 'Bloqueada' }, 403);
  await api(parcial, '/meu-perfil/reconciliacao', {
    nomeCompleto: 'Conta Parcial Fictícia',
  });
  expect((await api<Registro[]>(parcial, '/minhas-empresas')).length).toBe(0);
  const antiga = await criarConta('antiga');
  sqlLocal("DELETE FROM organizacao.perfis WHERE id='" + antiga.id + "'");
  expect(await api(antiga, '/meu-perfil')).toBeNull();
  await api(antiga, '/meu-perfil/reconciliacao', {
    nomeCompleto: 'Conta Anterior Fictícia',
  });
  expect((await api<Registro[]>(antiga, '/minhas-empresas')).length).toBe(0);
  sqlLocal(
    "UPDATE organizacao.perfis SET status='inativo' WHERE id='" +
      antiga.id +
      "'",
  );
  await api(antiga, '/meu-perfil', undefined, 403);
  await api(
    antiga,
    '/meu-perfil/reconciliacao',
    { nomeCompleto: 'Não reativar' },
    403,
  );
  await api(antiga, '/empresas', { razaoSocial: 'Bloqueada' }, 403);
});

test('concorrência de CNPJ e matrícula não duplica cadastros nem deixa bootstrap parcial', async () => {
  // CNPJ sintético com DV válido, exclusivo desta execução.
  let raiz = ('99' + Date.now().toString().slice(-10)).slice(0, 12);
  for (const pesos of [
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  ]) {
    const resto =
      [...raiz].reduce((s, c, i) => s + Number(c) * pesos[i], 0) % 11;
    raiz += resto < 2 ? '0' : String(11 - resto);
  }
  const requisicao = (caminho: string, corpo: object) =>
    fetch('http://localhost:3201/api/v1' + caminho, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + gestor.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corpo),
    });
  const empresas = await Promise.all(
    [1, 2].map(() =>
      requisicao('/empresas', {
        razaoSocial: 'Empresa concorrente',
        cnpj: raiz,
      }),
    ),
  );
  expect(empresas.map((r) => r.status).sort()).toEqual([201, 409]);
  const alvo1 = await criarConta('concorrente1'),
    alvo2 = await criarConta('concorrente2');
  const vinculos = await Promise.all(
    [alvo1, alvo2].map((conta) =>
      requisicao('/empresas/' + a + '/vinculos', {
        usuarioId: conta.id,
        papeis: ['trabalhador'],
        matriculaFuncional: 'CONCORRENTE',
        motivo: 'Teste de unicidade',
      }),
    ),
  );
  expect(vinculos.map((r) => r.status).sort()).toEqual([201, 409]);
});

test('navegador real: login, perfil, empresa, estrutura, gestão e alternância sem mistura', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(gestor.email);
  await page.getByLabel('Senha', { exact: true }).fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Meu perfil', exact: true }).click();
  await expect(page.getByLabel('Nome completo')).toHaveValue(
    'Gestor Fictício Atualizado',
  );
  await page.getByRole('link', { name: 'Nova empresa', exact: true }).click();
  await page.getByLabel('Razão social').fill('Empresa Navegador ' + sufixo);
  await page
    .getByRole('button', { name: 'Cadastrar empresa', exact: true })
    .click();
  await expect(
    page
      .locator('#empresa option')
      .filter({ hasText: 'Empresa Navegador ' + sufixo }),
  ).toHaveCount(1);
  await page
    .getByLabel('Empresa', { exact: true })
    .selectOption({ label: 'Empresa Navegador ' + sufixo });
  await page
    .getByRole('link', { name: 'Estabelecimentos', exact: true })
    .click();
  await page.getByLabel('Nome', { exact: true }).fill('Unidade Navegador');
  await page
    .getByRole('button', { name: 'Salvar cadastro', exact: true })
    .click();
  await expect(
    page.getByText('Cadastro salvo.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Unidade Navegador', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Empresa', { exact: true }).selectOption(a);
  await expect(page.getByText('Unidade A', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Unidade Navegador', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Usuários', exact: true }).click();
  await expect(
    page.getByLabel('Matrícula funcional', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Entrar', exact: true }),
  ).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill(consultoria.email);
  await page.getByLabel('Senha', { exact: true }).fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page
    .getByRole('link', { name: 'Carteira da consultoria', exact: true })
    .click();
  await expect(page.getByLabel('Empresa', { exact: true })).toHaveValue(b);
  await expect(
    page.getByRole('link', { name: 'Usuários', exact: true }),
  ).toHaveCount(0);
});

test('navegador real: cadastro com confirmação e recuperação de senha pelo Mailpit', async ({
  page,
}) => {
  const email = 'interface-' + sufixo + '@example.invalid';
  await page.goto('/cadastro');
  await page.getByLabel('Nome completo').fill('Pessoa Interface Fictícia');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(senha);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(senha);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('e-mail de confirmação');
  await confirmarEmail(email);
  await page
    .getByRole('link', { name: 'Esqueci minha senha', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Recuperar senha', exact: true }),
  ).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page
    .getByRole('button', { name: 'Recuperar senha', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText(
    'instruções para recuperar',
  );
  const fragmento = await fragmentoConfirmado(email, 'recovery');
  const novaSenha = senha + 'nova';
  await page.evaluate((hash) => {
    window.location.href = '/atualizar-senha' + hash;
  }, fragmento);
  await expect(
    page.getByRole('heading', { name: 'Nova senha', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Senha', { exact: true }).fill(novaSenha);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(novaSenha);
  await page
    .getByRole('button', { name: 'Salvar nova senha', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Senha atualizada.');
  expect(
    (await auth('/token?grant_type=password', { email, password: senha }))
      .status,
  ).toBe(400);
  expect((await entrar(email, novaSenha)).id).toBeTruthy();
});

test('conta criada por gestor usa confirmação real na recuperação e mantém matrícula no vínculo', async () => {
  const email = 'administrada-' + sufixo + '@example.invalid';
  const criada = await api<Registro & { usuarioId: string }>(
    gestor,
    '/empresas/' + a + '/usuarios',
    {
      nomeCompleto: 'Conta Administrada Fictícia',
      email,
      senha,
      papeis: ['trabalhador'],
      matriculaFuncional: 'ADMIN-007',
      motivo: 'Cadastro administrativo fictício',
    },
  );
  expect(criada.matriculaFuncional).toBe('ADMIN-007');
  expect(
    (await auth('/token?grant_type=password', { email, password: senha }))
      .status,
  ).toBe(400);
  expect((await auth('/recover', { email })).status).toBe(200);
  await confirmarEmail(email, 'recovery');
  const conta = await entrar(email);
  expect(conta.id).toBe(criada.usuarioId);
  expect(
    (await api<Registro[]>(conta, '/meus-vinculos'))[0].matriculaFuncional,
  ).toBe('ADMIN-007');
});

test('revogações concorrentes preservam o último gestor e empresa inativa encerra acesso', async () => {
  const empresa = (
    await api<Registro>(gestor, '/empresas', {
      razaoSocial: 'Empresa Revogação ' + sufixo,
    })
  ).id;
  const vinculo1 = (
    await api<(Registro & { empresaId: string })[]>(gestor, '/meus-vinculos')
  ).find((v) => v.empresaId === empresa)!;
  const vinculo2 = await api<Registro>(
    gestor,
    '/empresas/' + empresa + '/vinculos',
    {
      usuarioId: outro.id,
      papeis: ['gestor_sst_rh'],
      motivo: 'Segundo gestor fictício',
    },
  );
  const p1 = (
    await api<Registro[]>(
      gestor,
      '/empresas/' + empresa + '/vinculos/' + vinculo1.id + '/papeis',
    )
  )[0];
  const p2 = (
    await api<Registro[]>(
      gestor,
      '/empresas/' + empresa + '/vinculos/' + vinculo2.id + '/papeis',
    )
  )[0];
  const resultados = await Promise.all(
    [
      [gestor, vinculo2.id, p2.id],
      [outro, vinculo1.id, p1.id],
    ].map(async ([pessoa, vinculo, papel]) => {
      const conta = pessoa as Conta;
      const r = await fetch(
        'http://localhost:3201/api/v1/empresas/' +
          empresa +
          '/vinculos/' +
          vinculo +
          '/papeis/' +
          papel +
          '/revogacao',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + conta.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ motivo: 'Revogação concorrente' }),
        },
      );
      return r.status;
    }),
  );
  expect(resultados.slice().sort()).toEqual([201, 403]);
  const vencedor = resultados[0] === 201 ? gestor : outro;
  await api(
    vencedor,
    '/empresas/' + empresa,
    { razaoSocial: 'Empresa Inativa', status: 'inativo' },
    200,
    'PATCH',
  );
  await api(vencedor, '/empresas/' + empresa, undefined, 403);
});
