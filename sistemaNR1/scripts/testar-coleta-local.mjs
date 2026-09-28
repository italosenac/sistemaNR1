import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import {
  gerarPdfRascunho,
  hashSha256,
} from '../apps/api/dist/infraestrutura/pdf-rascunho.js';
import {
  calcularAvaliacao,
  matrizDemonstrativa,
} from '../apps/api/dist/dominio/matriz-risco.js';

const requireApi = createRequire(resolve('apps/api/package.json'));
const { Client } = requireApi('pg');
const ambiente = JSON.parse(readFileSync('.e1/ambiente.local.json', 'utf8'));
const banco = new URL(ambiente.DATABASE_URL);
if (
  ambiente.SUPABASE_URL !== 'http://127.0.0.1:55321' ||
  banco.hostname !== '127.0.0.1' ||
  banco.port !== '55322'
)
  throw new Error(
    'Teste de coleta permitido apenas no Supabase local isolado.',
  );

const criarCliente = () =>
  new Client({ connectionString: ambiente.DATABASE_URL, ssl: false });
const senha = randomBytes(24).toString('hex');
const marca = randomBytes(6).toString('hex');
const hash = () => createHash('sha256').update(randomBytes(32)).digest('hex');
const codigo = (erro) =>
  typeof erro === 'object' && erro !== null && 'code' in erro
    ? erro.code
    : 'DESCONHECIDO';
let etapaHttp = 'inicio';
let estadoHttp = 0;
let categoriaHttp = '';
let etapaM2 = 'inicio';
let etapaM3 = 'inicio';
let saidaApi = '';
let redeApi = '';

async function portaLivre() {
  const servidor = createServer();
  await new Promise((resolver) => servidor.listen(0, '127.0.0.1', resolver));
  const porta = servidor.address().port;
  await new Promise((resolver) => servidor.close(resolver));
  return porta;
}

async function testarHttp(
  empresa,
  unidade,
  fotografia,
  grupo,
  pacotePublicavel,
) {
  etapaHttp = 'porta-livre';
  const porta = await portaLivre();
  etapaHttp = 'api-iniciando';
  const processo = spawn(process.execPath, [resolve('apps/api/dist/main.js')], {
    env: {
      ...process.env,
      ...ambiente,
      NODE_ENV: 'test',
      PORT: String(porta),
      FRONTEND_URL: 'http://localhost:3000',
    },
    stdio: 'ignore',
    windowsHide: true,
  });
  try {
    let pronto = false;
    for (let tentativa = 0; tentativa < 80; tentativa++) {
      if (processo.exitCode !== null) break;
      try {
        const resposta = await fetch(`http://127.0.0.1:${porta}/health`);
        if (resposta.status === 200) {
          pronto = true;
          break;
        }
      } catch (erro) {
        redeApi = erro?.cause?.code ?? 'SEM_CODIGO';
      }
      await new Promise((resolver) => setTimeout(resolver, 250));
    }
    if (!pronto) {
      saidaApi =
        processo.exitCode === null ? 'sem-health' : 'processo-encerrou';
      throw new Error('API local indisponível.');
    }
    etapaHttp = 'login';
    const login = await fetch(
      `${ambiente.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: ambiente.SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `e2-local-gestor-${marca}@example.invalid`,
          password: senha,
        }),
      },
    );
    if (login.status !== 200) throw new Error('Login da fixture local falhou.');
    const sessao = await login.json();
    const base = `http://127.0.0.1:${porta}/api/v1/empresas/${empresa}/campanhas`;
    const cabecalhos = {
      Authorization: `Bearer ${sessao.access_token}`,
      'Content-Type': 'application/json',
    };
    etapaHttp = 'criar';
    const agora = Date.now();
    const criar = await fetch(base, {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({
        estabelecimentoId: unidade,
        titulo: 'Campanha API fictícia ' + marca,
        inicio: new Date(agora - 60_000).toISOString(),
        fim: new Date(agora + 6_000).toISOString(),
        fuso: 'America/Sao_Paulo',
        metaPercentual: 50,
        canalDivulgacao: 'Canal fictício',
        canalAlternativo: 'Canal alternativo fictício',
      }),
    });
    estadoHttp = criar.status;
    if (criar.status !== 201) {
      categoriaHttp = (await criar.json()).codigo ?? '';
      throw new Error('Criação da campanha pela API falhou.');
    }
    const { id: campanha } = await criar.json();
    etapaHttp = 'adicionar-grupo';
    const adicionar = await fetch(base + '/' + campanha + '/grupos', {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({ grupoId: grupo, populacaoEsperada: 10 }),
    });
    estadoHttp = adicionar.status;
    if (adicionar.status !== 201) {
      categoriaHttp = (await adicionar.json()).codigo ?? '';
      throw new Error('Grupo da campanha pela API falhou.');
    }
    etapaHttp = 'publicar';
    const publicar = await fetch(base + '/' + campanha + '/publicacao', {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({ estruturaCongeladaId: fotografia }),
    });
    estadoHttp = publicar.status;
    if (publicar.status !== 201) {
      categoriaHttp = (await publicar.json()).codigo ?? '';
      throw new Error('Publicação pela API falhou.');
    }
    etapaHttp = 'listar';
    const lista = await fetch(base, { headers: cabecalhos });
    if (
      lista.status !== 200 ||
      !(await lista.json()).some(
        (item) => item.id === campanha && item.estado === 'publicada',
      )
    )
      throw new Error('Campanha publicada não listada pela API.');
    const emissao = await fetch(`${base}/${campanha}/codigos`, {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({ grupoId: grupo }),
    });
    etapaHttp = 'emitir';
    estadoHttp = emissao.status;
    if (emissao.status !== 201) {
      categoriaHttp = (await emissao.json()).codigo ?? '';
      throw new Error('Emissão de código pela API falhou.');
    }
    const { codigo: codigoBruto } = await emissao.json();
    if (
      !/^[a-f0-9]{64}$/.test(codigoBruto) ||
      emissao.headers.get('cache-control') !== 'no-store'
    )
      throw new Error('Código da API inválido ou armazenável em cache.');
    const enviar = (corpo) =>
      fetch(`http://127.0.0.1:${porta}/api/v1/questionarios/respostas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
    const entrada = {
      codigo: codigoBruto,
      sobrecargaPercebida: 1,
      ritmoPercebido: 2,
    };
    const nominal = await enviar({ ...entrada, nome: 'Pessoa Fictícia' });
    etapaHttp = 'responder';
    const primeira = await enviar(entrada);
    const repetida = await enviar(entrada);
    const espera = agora + 6_000 - Date.now() + 150;
    if (espera > 0)
      await new Promise((resolver) => setTimeout(resolver, espera));
    etapaHttp = 'encerrar';
    const encerramento = await fetch(base + '/' + campanha + '/encerramento', {
      method: 'POST',
      headers: cabecalhos,
    });
    estadoHttp = encerramento.status;
    if (encerramento.status !== 201) {
      categoriaHttp = (await encerramento.json()).codigo ?? '';
      throw new Error('Encerramento pela API falhou.');
    }
    const { registroConsultaId } = await encerramento.json();
    etapaHttp = 'agregados';
    const leitura = await fetch(base + '/' + campanha + '/agregados', {
      headers: cabecalhos,
    });
    estadoHttp = leitura.status;
    if (leitura.status !== 200) {
      categoriaHttp = (await leitura.json()).codigo ?? '';
      throw new Error('Leitura agregada pela API falhou.');
    }
    const pacote = await leitura.json();
    const coletaAprovada =
      nominal.status === 400 &&
      primeira.status === 202 &&
      repetida.status === 400 &&
      pacote.registroConsultaId === registroConsultaId &&
      pacote.resultado.estado === 'suprimido' &&
      pacote.resultado.particoes.length === 0;
    if (!coletaAprovada) return false;
    etapaHttp = 'login-tecnico';
    const loginTecnico = await fetch(
      `${ambiente.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: ambiente.SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `e2-local-tecnico-${marca}@example.invalid`,
          password: senha,
        }),
      },
    );
    if (loginTecnico.status !== 200)
      throw new Error('Login técnico local falhou.');
    const sessaoTecnica = await loginTecnico.json();
    const headersTecnico = {
      Authorization: `Bearer ${sessaoTecnica.access_token}`,
      'Content-Type': 'application/json',
    };
    const baseAvaliacao = `http://127.0.0.1:${porta}/api/v1/empresas/${empresa}/avaliacoes`;
    etapaHttp = 'criterio-api';
    const criterio = await fetch(`${baseAvaliacao}/criterios`, {
      method: 'POST',
      headers: headersTecnico,
      body: JSON.stringify({ matriz: matrizDemonstrativa }),
    });
    estadoHttp = criterio.status;
    if (criterio.status !== 201) {
      categoriaHttp = (await criterio.json()).codigo ?? '';
      throw new Error('Critério M2 pela API falhou.');
    }
    const criterioNovo = await criterio.json();
    const parte = pacotePublicavel.resultado.particoes.find(
      (p) => p.fatorId === 'sobrecarga_percebida',
    );
    etapaHttp = 'resultado-api';
    const resultado = await fetch(`${baseAvaliacao}/resultados`, {
      method: 'POST',
      headers: headersTecnico,
      body: JSON.stringify({
        campanhaId: pacotePublicavel.campanhaId,
        criterioId: criterioNovo.id,
        fatorId: parte.fatorId,
        escopoTipo: parte.escopoTipo,
        escopoId: parte.escopoId,
        perigo: 'Perigo psicossocial fictício via API',
        severidade: 3,
        probabilidade: 2,
        justificativaProbabilidade:
          'Exigências fictícias da atividade na demonstração.',
        consequencias: [
          { descricao: 'Possível agravo fictício', magnitude: 3 },
        ],
        indiceDeterminante: 0,
        riscoEvidente: true,
        medidaRegistrada: 'Medida fictícia registrada via API.',
        ergonomia: 'aep',
        referenciaErgonomia: 'AEP fictícia via API',
      }),
    });
    estadoHttp = resultado.status;
    if (resultado.status !== 201) {
      categoriaHttp = (await resultado.json()).codigo ?? '';
      throw new Error('Resultado M2 pela API falhou.');
    }
    const resultadoNovo = await resultado.json();
    etapaHttp = 'inventario-api';
    const alineas = alineasDemonstrativas();
    const inventario = await fetch(
      `http://127.0.0.1:${porta}/api/v1/empresas/${empresa}/inventarios/consolidacoes`,
      {
        method: 'POST',
        headers: headersTecnico,
        body: JSON.stringify({
          estabelecimentoId: unidade,
          itensPsicossociais: [{ avaliacaoId: resultadoNovo.id, alineas }],
          itensGerais: [
            {
              categoria: 'fisico',
              proveniencia: 'Inventário geral fictício via API.',
              alineas,
            },
          ],
        }),
      },
    );
    estadoHttp = inventario.status;
    if (inventario.status !== 201) {
      categoriaHttp = (await inventario.json()).codigo ?? '';
      throw new Error('Inventário M3 pela API falhou.');
    }
    const versaoNova = await inventario.json();
    etapaHttp = 'pdf-api';
    const pdf = await fetch(
      `http://127.0.0.1:${porta}/api/v1/empresas/${empresa}/inventarios/${versaoNova.id}/pdf`,
      { headers: headersTecnico },
    );
    const bytes = Buffer.from(await pdf.arrayBuffer());
    return (
      pdf.status === 200 &&
      bytes.subarray(0, 8).toString() === '%PDF-1.4' &&
      hashSha256(bytes) === versaoNova.hashPdf &&
      versaoNova.assinaturaEstado === 'nao_assinado'
    );
  } finally {
    processo.kill();
  }
}

async function criarConta(nome) {
  const email = `e2-local-${nome}-${marca}@example.invalid`;
  const r = await fetch(
    `${ambiente.SUPABASE_URL}/auth/v1/admin/generate_link`,
    {
      method: 'POST',
      headers: {
        apikey: ambiente.SUPABASE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'signup',
        email,
        password: senha,
        data: { nome_completo: `Pessoa Fictícia ${nome}` },
      }),
    },
  );
  if (r.status !== 200) throw new Error('Fixture Auth local indisponível.');
  const link = await r.json();
  const confirmado = await fetch(`${ambiente.SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: ambiente.SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'signup', token_hash: link.hashed_token }),
  });
  if (confirmado.status !== 200)
    throw new Error('Confirmação local da fixture falhou.');
  return link.user?.id ?? link.id;
}

async function contexto(cliente, ator) {
  await cliente.query('BEGIN');
  await cliente.query(
    "SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)",
    [ator, JSON.stringify({ sub: ator, role: 'authenticated' })],
  );
}

async function transacao(cliente, ator, executar) {
  await contexto(cliente, ator);
  try {
    const resultado = await executar();
    await cliente.query('COMMIT');
    return resultado;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  }
}

async function testarAgregacao(
  cliente,
  ator,
  outroAtor,
  empresa,
  unidade,
  fotografia,
  grupos,
) {
  const fim = new Date(Date.now() + 8_000);
  const casos = [
    { nome: 'seis', contagens: [6], estado: 'suprimido', particoes: 0 },
    { nome: 'sete', contagens: [7], estado: 'grupo', particoes: 2 },
    {
      nome: 'tres-cinco',
      contagens: [3, 5],
      estado: 'estabelecimento',
      particoes: 2,
    },
    {
      nome: 'sete-tres',
      contagens: [7, 3],
      estado: 'estabelecimento',
      particoes: 2,
    },
  ];
  let pacotePublicavel;
  for (const caso of casos) {
    caso.id = await transacao(cliente, ator, async () => {
      const id = (
        await cliente.query(
          'INSERT INTO coleta.campanhas(empresa_id,estabelecimento_id,titulo,inicio,fim,fuso,meta_percentual,canal_divulgacao,canal_alternativo,criado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
          [
            empresa,
            unidade,
            `Agregação fictícia ${caso.nome} ${marca}`,
            new Date(Date.now() - 60_000),
            fim,
            'America/Sao_Paulo',
            50,
            'Canal fictício',
            'Canal alternativo fictício',
            ator,
          ],
        )
      ).rows[0].id;
      for (let indice = 0; indice < caso.contagens.length; indice++) {
        const grupo = grupos[indice];
        await cliente.query('SELECT coleta.adicionar_grupo($1,$2,10)', [
          id,
          grupo,
        ]);
      }
      await cliente.query('SELECT coleta.publicar_campanha($1,$2)', [
        id,
        fotografia,
      ]);
      for (let indice = 0; indice < caso.contagens.length; indice++) {
        for (let n = 0; n < caso.contagens[indice]; n++) {
          const credencial = hash();
          await cliente.query('SELECT coleta.emitir_codigo($1,$2,$3)', [
            id,
            grupos[indice],
            credencial,
          ]);
          await cliente.query(
            'SELECT coleta.registrar_resposta($1,2::smallint,3::smallint)',
            [credencial],
          );
        }
      }
      return id;
    });
  }
  const atraso = fim.getTime() - Date.now() + 150;
  if (atraso > 0) await new Promise((resolver) => setTimeout(resolver, atraso));
  for (const caso of casos) {
    const pacote = await transacao(cliente, ator, async () => {
      const registro = (
        await cliente.query('SELECT coleta.encerrar_com_agregado($1) id', [
          caso.id,
        ])
      ).rows[0].id;
      const resultado = (
        await cliente.query('SELECT coleta.pacote_agregado($1) pacote', [
          caso.id,
        ])
      ).rows[0].pacote;
      if (resultado.registroConsultaId !== registro)
        throw new Error('Registro e fotografia inconsistentes.');
      return resultado;
    });
    if (
      pacote.resultado.estado !== caso.estado ||
      pacote.resultado.particoes.length !== caso.particoes
    )
      throw new Error('Limiar ou partição incorreta.');
    if (
      caso.estado === 'estabelecimento' &&
      pacote.resultado.particoes.some((parte) => parte.escopoId !== unidade)
    )
      throw new Error('Complemento de grupo exposto.');
    if (
      caso.estado === 'grupo' &&
      pacote.resultado.particoes.some((parte) => parte.escopoId !== grupos[0])
    )
      throw new Error('Grupo publicável incorreto.');
    if (
      JSON.stringify(pacote).includes('respostas_validas') ||
      JSON.stringify(pacote).includes('taxa_interna')
    )
      throw new Error('Detalhe interno vazou no pacote.');
    if (caso.nome === 'sete') pacotePublicavel = pacote;
  }
  let isolado = false;
  try {
    await transacao(cliente, outroAtor, () =>
      cliente.query('SELECT coleta.pacote_agregado($1)', [casos[0].id]),
    );
  } catch (erro) {
    isolado = codigo(erro) === '42501';
  }
  return { isolado, pacotePublicavel };
}

async function testarM2(cliente, tecnico, gestor, estranho, empresa, pacote) {
  etapaM2 = 'matriz-incompleta';
  const matriz = matrizDemonstrativa;
  const incompleta = { ...matriz, celulas: matriz.celulas.slice(0, 8) };
  let matrizBloqueada = false;
  await contexto(cliente, tecnico);
  try {
    await cliente.query(
      'SELECT avaliacao.publicar_criterio($1,$2::jsonb,$3,$4,$5)',
      [
        empresa,
        JSON.stringify(incompleta),
        hash(),
        Buffer.alloc(200, 65),
        hash(),
      ],
    );
  } catch (erro) {
    matrizBloqueada = codigo(erro) === '23514';
  }
  await cliente.query('ROLLBACK');
  etapaM2 = 'publicar-criterio';
  const criterioId = await transacao(cliente, tecnico, async () => {
    const autorizado = (
      await cliente.query('SELECT avaliacao.pode_avaliar($1) permitido', [
        empresa,
      ])
    ).rows[0].permitido;
    if (!autorizado)
      throw new Error('Papel técnico da fixture não está ativo.');
    const conteudo = JSON.stringify(matriz);
    const hashConteudo = (
      await cliente.query('SELECT avaliacao.hash_matriz($1::jsonb) hash', [
        conteudo,
      ])
    ).rows[0].hash;
    const pdf = gerarPdfRascunho('Criterios demonstrativos M2', [
      `Empresa ficticia: ${empresa}`,
      `Versao: 1`,
      `Hash da matriz: ${hashConteudo}`,
      ...matriz.celulas.map(
        (c) =>
          `${c.severidade} x ${c.probabilidade}: ${c.faixa} - ${c.decisao}`,
      ),
      'Assinatura: _____________________',
    ]);
    if (!pdf.subarray(0, 8).toString().startsWith('%PDF-1.4'))
      throw new Error('Documento de critério inválido.');
    return (
      await cliente.query(
        'SELECT avaliacao.publicar_criterio($1,$2::jsonb,$3,$4,$5) id',
        [empresa, conteudo, hashConteudo, pdf, hashSha256(pdf)],
      )
    ).rows[0].id;
  });
  const parte = pacote.resultado.particoes.find(
    (p) => p.fatorId === 'sobrecarga_percebida',
  );
  const dados = {
    fatorId: parte.fatorId,
    escopoId: parte.escopoId,
    agregadoPublicavel: true,
    severidade: 3,
    probabilidade: 2,
    justificativaProbabilidade:
      'Exigências fictícias e medidas observadas pela equipe técnica.',
    consequencias: [{ descricao: 'Possível agravo fictício', magnitude: 3 }],
    indiceDeterminante: 0,
    riscoEvidente: true,
    medidaRegistrada: 'Medida fictícia registrada para demonstração.',
    ergonomia: 'aep',
    referenciaErgonomia: 'AEP fictícia 001',
  };
  const calculo = calcularAvaliacao(dados, matriz);
  const tecnicos = {
    consequencias: dados.consequencias,
    justificativaProbabilidade: dados.justificativaProbabilidade,
    ergonomia: dados.ergonomia,
    referenciaErgonomia: dados.referenciaErgonomia,
    riscoEvidente: dados.riscoEvidente,
    medidaRegistrada: dados.medidaRegistrada,
  };
  const parametros = [
    empresa,
    pacote.fotografiaId,
    criterioId,
    parte.fatorId,
    parte.escopoTipo,
    parte.escopoId,
    'Perigo psicossocial fictício',
    JSON.stringify(tecnicos),
    3,
    2,
    calculo.valor,
    calculo.faixa,
    calculo.decisaoOriginal,
    calculo.decisaoEfetiva,
    JSON.stringify(calculo.memoria),
  ];
  const consulta = `SELECT avaliacao.registrar_resultado($1,$2,$3,$4,$5,$6,$7,$8::jsonb,
    $9,$10,$11,$12,$13,$14,$15::jsonb) id`;
  etapaM2 = 'registrar-resultado';
  const resultadoId = await transacao(cliente, tecnico, () =>
    cliente.query(consulta, parametros),
  );
  etapaM2 = 'ler-resultado';
  const leitura = await transacao(cliente, gestor, () =>
    cliente.query(
      'SELECT valor,memoria,criterio_id FROM avaliacao.resultados WHERE empresa_id=$1 AND id=$2',
      [empresa, resultadoId.rows[0].id],
    ),
  );
  if (
    leitura.rows[0]?.valor !== 6 ||
    leitura.rows[0]?.criterio_id !== criterioId
  )
    throw new Error('Resultado M2 não foi persistido com a versão exata.');
  let supressao = false;
  await contexto(cliente, tecnico);
  try {
    await cliente.query(consulta, [
      ...parametros.slice(0, 1),
      randomUUID(),
      ...parametros.slice(2),
    ]);
  } catch (erro) {
    supressao = codigo(erro) === '23514';
  }
  await cliente.query('ROLLBACK');
  let isolamento = false;
  try {
    await transacao(cliente, estranho, () =>
      cliente.query(consulta, parametros),
    );
  } catch (erro) {
    isolamento = codigo(erro) === '42501';
  }
  const acesso = await cliente.query(`SELECT
    has_table_privilege(current_user,'avaliacao.resultados','INSERT') escrita,
    has_column_privilege(current_user,'avaliacao.criterios_versoes','pdf','SELECT') bytes_pdf`);
  const documento = await transacao(cliente, gestor, () =>
    cliente.query('SELECT avaliacao.pdf_criterio($1,$2) bytes', [
      empresa,
      criterioId,
    ]),
  );
  return {
    aprovado:
      matrizBloqueada &&
      supressao &&
      isolamento &&
      !acesso.rows[0].escrita &&
      !acesso.rows[0].bytes_pdf &&
      documento.rows[0].bytes.subarray(0, 8).toString() === '%PDF-1.4',
    resultadoId: resultadoId.rows[0].id,
  };
}

function alineasDemonstrativas() {
  return {
    a: 'Processo e ambiente sintéticos da unidade.',
    b: 'Atividade sintética do setor avaliado.',
    c: 'Fonte e circunstância geradora fictícias.',
    d: 'Possíveis agravos fictícios, sem diagnóstico.',
    e: 'Grupo agregado publicável, sem identidade.',
    f: 'Medida fictícia registrada para demonstração.',
    g: 'Exposição qualitativa fictícia de atividade.',
    h: 'Resultado de AEP fictícia 001, sem validade real.',
    i: 'Classificação recebida integralmente do M2.',
  };
}

async function testarM3(
  cliente,
  tecnico,
  gestor,
  estranho,
  empresa,
  unidade,
  resultadoId,
) {
  etapaM3 = 'validar-alineas';
  const alineas = alineasDemonstrativas();
  for (const letra of Object.keys(alineas)) {
    const ausente = { ...alineas };
    delete ausente[letra];
    const valido = (
      await cliente.query(
        'SELECT inventario.alineas_completas($1::jsonb) valido',
        [JSON.stringify(ausente)],
      )
    ).rows[0].valido;
    if (valido !== false) throw new Error('Alínea ausente não bloqueada.');
  }
  const itemPsicossocial = { avaliacaoId: resultadoId, alineas };
  const geral = {
    categoria: 'fisico',
    proveniencia: 'Inventário geral sintético da empresa de teste.',
    alineas: { ...alineas, c: 'Fonte física fictícia do ambiente de teste.' },
  };
  const avaliacao = await transacao(
    cliente,
    tecnico,
    async () =>
      (
        await cliente.query(
          'SELECT to_jsonb(r) registro FROM avaliacao.resultados r WHERE r.empresa_id=$1 AND r.id=$2',
          [empresa, resultadoId],
        )
      ).rows[0].registro,
  );
  if (!avaliacao) throw new Error('Avaliação de origem ausente.');
  async function consolidar(itemGeral, versao) {
    const conteudo = {
      tipo: 'inventario-geral-demonstrativo-v1',
      empresaId: empresa,
      estabelecimentoId: unidade,
      itensPsicossociais: [{ alineas, avaliacao }],
      itensGerais: [itemGeral],
    };
    const hashConteudo = (
      await cliente.query('SELECT avaliacao.hash_matriz($1::jsonb) hash', [
        JSON.stringify(conteudo),
      ])
    ).rows[0].hash;
    const pdf = gerarPdfRascunho('Inventario geral integrado', [
      `Empresa ficticia: ${empresa}`,
      `Estabelecimento: ${unidade}`,
      `Versao: ${versao} | Data: ${new Date().toISOString()}`,
      `Hash do conteudo: ${hashConteudo}`,
      'RISCO PSICOSSOCIAL - origem M2 preservada',
      `Avaliacao: ${resultadoId} | valor: ${avaliacao.valor} | faixa: ${avaliacao.faixa}`,
      ...Object.entries(alineas).map(([chave, valor]) => `${chave}) ${valor}`),
      'RISCO GERAL FICTICIO - proveniencia identificada',
      `Categoria: ${itemGeral.categoria} | ${itemGeral.proveniencia}`,
      ...Object.entries(itemGeral.alineas).map(
        ([chave, valor]) => `${chave}) ${valor}`,
      ),
      'Assinatura formal: ___________________________',
    ]);
    const resultado = await transacao(cliente, tecnico, () =>
      cliente.query(
        'SELECT inventario.consolidar($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7) id',
        [
          empresa,
          unidade,
          JSON.stringify([itemPsicossocial]),
          JSON.stringify([itemGeral]),
          pdf,
          hashSha256(pdf),
          hashConteudo,
        ],
      ),
    );
    return resultado.rows[0].id;
  }
  etapaM3 = 'bloqueio-sem-base-geral';
  let semGeralBloqueado = false;
  try {
    await transacao(cliente, tecnico, () =>
      cliente.query(
        'SELECT inventario.consolidar($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7)',
        [
          empresa,
          unidade,
          JSON.stringify([itemPsicossocial]),
          '[]',
          Buffer.alloc(200),
          hash(),
          hash(),
        ],
      ),
    );
  } catch (erro) {
    semGeralBloqueado = codigo(erro) === '23514';
  }
  etapaM3 = 'consolidacao-v1';
  const primeira = await consolidar(geral, 1);
  etapaM3 = 'consolidacao-v2';
  const segunda = await consolidar(
    {
      ...geral,
      alineas: {
        ...geral.alineas,
        b: 'Atividade geral sintética revisada e versionada.',
      },
    },
    2,
  );
  const versoes = await transacao(cliente, gestor, () =>
    cliente.query(
      'SELECT id,versao,conteudo,diferencas,assinatura_estado FROM inventario.versoes WHERE empresa_id=$1 AND estabelecimento_id=$2 ORDER BY versao',
      [empresa, unidade],
    ),
  );
  etapaM3 = 'imutabilidade';
  let bloqueio = false;
  try {
    await transacao(cliente, tecnico, () =>
      cliente.query(
        'DELETE FROM inventario.versoes WHERE empresa_id=$1 AND id=$2',
        [empresa, primeira],
      ),
    );
  } catch (erro) {
    bloqueio = codigo(erro) === '42501';
  }
  const oculto = await transacao(cliente, estranho, () =>
    cliente.query(
      'SELECT id FROM inventario.versoes WHERE empresa_id=$1 AND id=$2',
      [empresa, primeira],
    ),
  );
  let downloadIsolado = false;
  try {
    await transacao(cliente, estranho, () =>
      cliente.query('SELECT inventario.pdf_versao($1,$2)', [empresa, primeira]),
    );
  } catch (erro) {
    downloadIsolado = codigo(erro) === '42501';
  }
  const [v1, v2] = versoes.rows;
  return (
    semGeralBloqueado &&
    bloqueio &&
    oculto.rowCount === 0 &&
    downloadIsolado &&
    v1?.id === primeira &&
    v2?.id === segunda &&
    v1.versao === 1 &&
    v2.versao === 2 &&
    v1.conteudo.itensPsicossociais[0].avaliacao.valor === avaliacao.valor &&
    v1.assinatura_estado === 'nao_assinado' &&
    v2.diferencas.hashAnterior &&
    v2.diferencas.conteudoAlterado === true
  );
}

const clientes = [criarCliente(), criarCliente(), criarCliente()];
let etapa = 'auth';
try {
  const [gestor, estranho, tecnico] = await Promise.all([
    criarConta('gestor'),
    criarConta('estranho'),
    criarConta('tecnico'),
  ]);
  if (!gestor || !estranho || !tecnico)
    throw new Error('Fixture Auth sem identificador.');
  await Promise.all(clientes.map((cliente) => cliente.connect()));
  etapa = 'fixture-principal';
  const [principal, concorrente, terceiro] = clientes;
  const { empresa, unidade, fotografia, campanha, grupo, grupoSecundario } =
    await transacao(principal, gestor, async () => {
      const empresa = (
        await principal.query(
          "SELECT organizacao.criar_empresa($1,'','','','') id",
          [`Empresa Fictícia E2 ${marca}`],
        )
      ).rows[0].id;
      const unidade = (
        await principal.query(
          'INSERT INTO organizacao.estabelecimentos(empresa_id,nome) VALUES($1,$2) RETURNING id',
          [empresa, 'Unidade Fictícia'],
        )
      ).rows[0].id;
      const setor = (
        await principal.query(
          'INSERT INTO organizacao.setores(empresa_id,estabelecimento_id,nome) VALUES($1,$2,$3) RETURNING id',
          [empresa, unidade, 'Setor Fictício'],
        )
      ).rows[0].id;
      const grupo = (
        await principal.query(
          'INSERT INTO organizacao.grupos(empresa_id,estabelecimento_id,setor_id,nome,quantidade_estimada_trabalhadores) VALUES($1,$2,$3,$4,10) RETURNING id',
          [empresa, unidade, setor, 'Grupo Fictício'],
        )
      ).rows[0].id;
      const setorSecundario = (
        await principal.query(
          'INSERT INTO organizacao.setores(empresa_id,estabelecimento_id,nome) VALUES($1,$2,$3) RETURNING id',
          [empresa, unidade, 'Outro Setor Fictício'],
        )
      ).rows[0].id;
      const grupoSecundario = (
        await principal.query(
          'INSERT INTO organizacao.grupos(empresa_id,estabelecimento_id,setor_id,nome,quantidade_estimada_trabalhadores) VALUES($1,$2,$3,$4,10) RETURNING id',
          [empresa, unidade, setorSecundario, 'Outro Grupo Fictício'],
        )
      ).rows[0].id;
      const fotografia = (
        await principal.query(
          "INSERT INTO organizacao.estruturas_congeladas(empresa_id,estabelecimento_id,revisao,populacao_total,conteudo,criado_por) VALUES($1,$2,1,20,'{}'::jsonb,$3) RETURNING id",
          [empresa, unidade, gestor],
        )
      ).rows[0].id;
      const campanha = (
        await principal.query(
          "INSERT INTO coleta.campanhas(empresa_id,estabelecimento_id,titulo,inicio,fim,fuso,meta_percentual,canal_divulgacao,canal_alternativo,criado_por) VALUES($1,$2,$3,now()-interval '1 minute',now()+interval '1 hour','America/Sao_Paulo',50,'Canal fictício','Canal alternativo fictício',$4) RETURNING id",
          [empresa, unidade, `Campanha fictícia ${marca}`, gestor],
        )
      ).rows[0].id;
      await principal.query('SELECT coleta.adicionar_grupo($1,$2,10)', [
        campanha,
        grupo,
      ]);
      await principal.query('SELECT coleta.publicar_campanha($1,$2)', [
        campanha,
        fotografia,
      ]);
      return { empresa, unidade, fotografia, campanha, grupo, grupoSecundario };
    });
  await transacao(principal, estranho, async () => {
    etapa = 'fixture-outra-empresa';
    const empresa = (
      await principal.query(
        "SELECT organizacao.criar_empresa($1,'','','','') id",
        [`Outra Empresa Fictícia E2 ${marca}`],
      )
    ).rows[0].id;
    if (!empresa) throw new Error('Segunda empresa fictícia não criada.');
  });
  await transacao(principal, gestor, async () => {
    const vinculo = (
      await principal.query(
        'INSERT INTO organizacao.vinculos_organizacionais(empresa_id,usuario_id) VALUES($1,$2) RETURNING id',
        [empresa, tecnico],
      )
    ).rows[0].id;
    await principal.query(
      "INSERT INTO organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) VALUES($1,$2,'responsavel_tecnico',$3,'Fixture tecnica ficticia')",
      [empresa, vinculo, gestor],
    );
  });

  const primeiro = hash();
  etapa = 'emitir-primeiro';
  await transacao(principal, gestor, () =>
    principal.query('SELECT coleta.emitir_codigo($1,$2,$3)', [
      campanha,
      grupo,
      primeiro,
    ]),
  );
  let isolamento = false;
  etapa = 'isolamento';
  try {
    await transacao(terceiro, estranho, () =>
      terceiro.query('SELECT coleta.emitir_codigo($1,$2,$3)', [
        campanha,
        grupo,
        hash(),
      ]),
    );
  } catch (erro) {
    isolamento = codigo(erro) === '42501';
  }

  await contexto(principal, gestor);
  etapa = 'rollback';
  await principal.query(
    'SELECT coleta.registrar_resposta($1,1::smallint,2::smallint)',
    [primeiro],
  );
  await principal.query('ROLLBACK');
  await transacao(principal, gestor, () =>
    principal.query(
      'SELECT coleta.registrar_resposta($1,1::smallint,2::smallint)',
      [primeiro],
    ),
  );
  let reusoBloqueado = false;
  try {
    await transacao(principal, gestor, () =>
      principal.query(
        'SELECT coleta.registrar_resposta($1,1::smallint,2::smallint)',
        [primeiro],
      ),
    );
  } catch (erro) {
    reusoBloqueado = codigo(erro) === '23514';
  }

  const segundo = hash();
  etapa = 'concorrencia';
  await transacao(principal, gestor, () =>
    principal.query('SELECT coleta.emitir_codigo($1,$2,$3)', [
      campanha,
      grupo,
      segundo,
    ]),
  );
  const resultados = await Promise.allSettled([
    transacao(principal, gestor, () =>
      principal.query(
        'SELECT coleta.registrar_resposta($1,2::smallint,3::smallint)',
        [segundo],
      ),
    ),
    transacao(concorrente, gestor, () =>
      concorrente.query(
        'SELECT coleta.registrar_resposta($1,2::smallint,3::smallint)',
        [segundo],
      ),
    ),
  ]);
  const concorrencia =
    resultados.filter((r) => r.status === 'fulfilled').length === 1 &&
    resultados.filter(
      (r) => r.status === 'rejected' && codigo(r.reason) === '23514',
    ).length === 1;
  const acesso = await principal.query(
    "SELECT has_table_privilege(current_user,'coleta.respostas_protegidas','SELECT') respostas, has_table_privilege(current_user,'coleta.codigos','SELECT') codigos",
  );
  const sigilo = !acesso.rows[0].respostas && !acesso.rows[0].codigos;
  etapa = 'fechamento-agregado';
  const agregacao = await testarAgregacao(
    principal,
    gestor,
    estranho,
    empresa,
    unidade,
    fotografia,
    [grupo, grupoSecundario],
  );
  etapa = 'avaliacao-m2';
  const avaliacaoM2 = await testarM2(
    principal,
    tecnico,
    gestor,
    estranho,
    empresa,
    agregacao.pacotePublicavel,
  );
  etapa = 'inventario-m3';
  const inventarioM3 = await testarM3(
    principal,
    tecnico,
    gestor,
    estranho,
    empresa,
    unidade,
    avaliacaoM2.resultadoId,
  );
  etapa = 'api-http';
  const apiAnonima = await testarHttp(
    empresa,
    unidade,
    fotografia,
    grupo,
    agregacao.pacotePublicavel,
  );
  const aprovado =
    isolamento &&
    reusoBloqueado &&
    concorrencia &&
    sigilo &&
    agregacao.isolado &&
    avaliacaoM2.aprovado &&
    inventarioM3 &&
    apiAnonima;
  console.log(
    JSON.stringify({
      aprovado,
      isolamento,
      rollbackRecuperouCodigo: true,
      reusoBloqueado,
      concorrencia,
      leituraSensivelNegada: sigilo,
      agregacao: agregacao.isolado,
      avaliacaoM2: avaliacaoM2.aprovado,
      inventarioM3,
      apiAnonima,
    }),
  );
  if (!aprovado) process.exitCode = 1;
} catch (erro) {
  console.error(
    JSON.stringify({
      aprovado: false,
      categoria: 'INTEGRACAO_LOCAL',
      etapa,
      etapaHttp,
      etapaM2,
      etapaM3,
      estadoHttp,
      categoriaHttp,
      saidaApi,
      redeApi,
      codigo: codigo(erro),
      detalhe: erro?.message?.slice(0, 120) ?? '',
    }),
  );
  process.exitCode = 1;
} finally {
  await Promise.allSettled(clientes.map((cliente) => cliente.end()));
}
