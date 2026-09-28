import { Inject, Injectable } from '@nestjs/common';
import type {
  AtribuicaoPapel,
  DadosEmpresa,
  DadosEstrutura,
  DadosProfissionais,
  Empresa,
  EstruturaCongelada,
  IdentificacaoProfissional,
  LotacaoUsuario,
  PapelUsuario,
  PerfilUsuario,
  RegistroEstrutura,
  StatusCadastro,
  TipoEstrutura,
  VinculoUsuario,
} from '@sistemanr1/contratos';
import type { PoolClient } from 'pg';
import { RepositorioOrganizacao } from '../aplicacao/portas-organizacao.js';
import { BancoOrganizacao } from './banco-organizacao.js';
import { ErroDeUsuario, validarLotacao } from '../dominio/usuario.js';
import { normalizarMatricula, validarGrupo } from '../dominio/organizacao.js';
import {
  ORIGEM_VINCULO,
  PROJECAO_VINCULO,
  obterVinculo,
} from './consultas-usuarios.js';

const DATAS = 'criado_em AS "criadoEm",atualizado_em AS "atualizadoEm"';
const PERFIL = `id,nome_completo AS "nomeCompleto",status,${DATAS}`;
const EMPRESA = `id,razao_social AS "razaoSocial",nome_fantasia AS "nomeFantasia",cnpj,email_corporativo AS "emailCorporativo",telefone,status,${DATAS}`;
const ATRIBUICAO =
  'id,papel,status,criado_em AS "criadoEm",revogado_em AS "revogadoEm"';
type CampoEstrutura = readonly [keyof DadosEstrutura, string];
const BASE: readonly CampoEstrutura[] = [
  ['nome', 'nome'],
  ['descricao', 'descricao'],
  ['status', 'status'],
];
const CAMPOS: Record<TipoEstrutura, readonly CampoEstrutura[]> = {
  estabelecimentos: [
    ...BASE,
    ['endereco', 'endereco'],
    ['caracterizacaoAmbiente', 'caracterizacao_ambiente'],
  ],
  setores: [...BASE, ['estabelecimentoId', 'estabelecimento_id']],
  funcoes: BASE,
  turnos: [
    ...BASE,
    ['horarioInicio', 'horario_inicio'],
    ['horarioFim', 'horario_fim'],
  ],
  grupos: [
    ...BASE,
    ['estabelecimentoId', 'estabelecimento_id'],
    ['setorId', 'setor_id'],
    ['funcaoId', 'funcao_id'],
    ['turnoId', 'turno_id'],
    ['quantidadeEstimadaTrabalhadores', 'quantidade_estimada_trabalhadores'],
  ],
};
function campos(tipo: TipoEstrutura) {
  const lista = CAMPOS[tipo];
  if (!lista)
    throw new ErroDeUsuario('DADOS_INVALIDOS', 'Tipo de estrutura inválido.');
  return lista;
}
function projecao(tipo: TipoEstrutura) {
  return `id,empresa_id AS "empresaId",${DATAS},${campos(tipo)
    .map(([nome, coluna]) => `${coluna} AS "${nome}"`)
    .join(',')}`;
}
function exigir<T>(valor: T | undefined): T {
  if (!valor)
    throw new ErroDeUsuario(
      'NAO_ENCONTRADO',
      'Registro não encontrado no contexto autorizado.',
    );
  return valor;
}

@Injectable()
export class RepositorioOrganizacaoPostgres extends RepositorioOrganizacao {
  constructor(
    @Inject(BancoOrganizacao) private readonly banco: BancoOrganizacao,
  ) {
    super();
  }
  perfil(ator: string): Promise<PerfilUsuario | null> {
    return this.banco.transacao(ator, async (c) => {
      const perfil = (
        await c.query<PerfilUsuario>(
          `SELECT ${PERFIL} FROM organizacao.perfis WHERE id=$1`,
          [ator],
        )
      ).rows[0];
      if (perfil?.status === 'inativo')
        throw new ErroDeUsuario('SEM_PERMISSAO', 'Sua conta está inativa.');
      return perfil ?? null;
    });
  }
  atualizarPerfil(
    ator: string,
    nome: string,
    reconciliar: boolean,
  ): Promise<PerfilUsuario> {
    return this.banco.transacao(ator, async (c) => {
      if (reconciliar)
        await c.query('SELECT organizacao.reconciliar_perfil($1)', [nome]);
      else {
        await this.banco.exigirPerfilAtivo(c);
        await c.query(
          'UPDATE organizacao.perfis SET nome_completo=$1,atualizado_em=now() WHERE id=$2',
          [nome, ator],
        );
      }
      return exigir(
        (
          await c.query<PerfilUsuario>(
            `SELECT ${PERFIL} FROM organizacao.perfis WHERE id=$1`,
            [ator],
          )
        ).rows[0],
      );
    });
  }
  profissionais(ator: string): Promise<IdentificacaoProfissional[]> {
    return this.banco.transacao(ator, async (c) => {
      await this.banco.exigirPerfilAtivo(c);
      return (
        await c.query<IdentificacaoProfissional>(
          'SELECT id,conselho,numero_registro AS "numeroRegistro",uf,verificado FROM organizacao.identificacoes_profissionais WHERE usuario_id=$1 ORDER BY conselho',
          [ator],
        )
      ).rows;
    });
  }
  salvarProfissional(
    ator: string,
    dados: DadosProfissionais,
    id?: string,
  ): Promise<IdentificacaoProfissional> {
    return this.banco.transacao(ator, async (c) => {
      await this.banco.exigirPerfilAtivo(c);
      const projecao =
        'id,conselho,numero_registro AS "numeroRegistro",uf,verificado';
      const valores = [
        dados.conselho,
        dados.numeroRegistro,
        dados.uf ?? null,
        ator,
      ];
      const resultado = id
        ? await c.query<IdentificacaoProfissional>(
            `UPDATE organizacao.identificacoes_profissionais SET conselho=$1,numero_registro=$2,uf=$3,atualizado_em=now() WHERE usuario_id=$4 AND id=$5 RETURNING ${projecao}`,
            [...valores, id],
          )
        : await c.query<IdentificacaoProfissional>(
            `INSERT INTO organizacao.identificacoes_profissionais(conselho,numero_registro,uf,usuario_id) VALUES($1,$2,$3,$4) RETURNING ${projecao}`,
            valores,
          );
      return exigir(resultado.rows[0]);
    });
  }
  criarEmpresa(ator: string, dados: DadosEmpresa): Promise<Empresa> {
    return this.banco.transacao(ator, async (c) => {
      await this.banco.exigirPerfilAtivo(c);
      const { rows } = await c.query<{ id: string }>(
        'SELECT organizacao.criar_empresa($1,$2,$3,$4,$5) AS id',
        [
          dados.razaoSocial,
          dados.nomeFantasia ?? null,
          dados.cnpj ?? null,
          dados.emailCorporativo ?? null,
          dados.telefone ?? null,
        ],
      );
      return exigir(
        (
          await c.query<Empresa>(
            `SELECT ${EMPRESA} FROM organizacao.empresas WHERE id=$1`,
            [rows[0].id],
          )
        ).rows[0],
      );
    });
  }
  empresa(ator: string, empresa: string): Promise<Empresa> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      'empresa:ler',
      false,
      async (c) =>
        exigir(
          (
            await c.query<Empresa>(
              `SELECT ${EMPRESA} FROM organizacao.empresas WHERE id=$1`,
              [empresa],
            )
          ).rows[0],
        ),
    );
  }
  editarEmpresa(
    ator: string,
    empresa: string,
    dados: DadosEmpresa & { status: StatusCadastro },
  ): Promise<Empresa> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      'empresa:editar',
      true,
      async (c) =>
        exigir(
          (
            await c.query<Empresa>(
              `UPDATE organizacao.empresas SET razao_social=$1,nome_fantasia=$2,cnpj=$3,email_corporativo=$4,telefone=$5,status=$6 WHERE id=$7 RETURNING ${EMPRESA}`,
              [
                dados.razaoSocial,
                dados.nomeFantasia ?? null,
                dados.cnpj ?? null,
                dados.emailCorporativo ?? null,
                dados.telefone ?? null,
                dados.status,
                empresa,
              ],
            )
          ).rows[0],
        ),
    );
  }
  estrutura(
    ator: string,
    empresa: string,
    tipo: TipoEstrutura,
  ): Promise<RegistroEstrutura[]> {
    const selecao = projecao(tipo);
    return this.banco.comEmpresa(
      ator,
      empresa,
      'estrutura:ler',
      false,
      async (c) =>
        (
          await c.query<RegistroEstrutura>(
            `SELECT ${selecao} FROM organizacao.${tipo} WHERE empresa_id=$1 ORDER BY nome`,
            [empresa],
          )
        ).rows,
    );
  }
  salvarEstrutura(
    ator: string,
    empresa: string,
    tipo: TipoEstrutura,
    dados: DadosEstrutura,
    id?: string,
  ): Promise<RegistroEstrutura> {
    const colunas = campos(tipo);
    return this.banco.comEmpresa(
      ator,
      empresa,
      'estrutura:gerenciar',
      true,
      async (c) => {
        if (tipo === 'grupos' && dados.status === 'ativo') {
          const existentes = await c.query<RegistroEstrutura>(
            `SELECT ${projecao('grupos')} FROM organizacao.grupos WHERE empresa_id=$1 AND status='ativo' AND ($2::uuid IS NULL OR id<>$2)`,
            [empresa, id ?? null],
          );
          validarGrupo(dados, existentes.rows);
        }
        const valores = colunas.map(
          ([campo]) =>
            dados[campo] ??
            (['descricao', 'caracterizacaoAmbiente'].includes(campo)
              ? ''
              : null),
        );
        const placeholders = valores.map((_, i) => '$' + (i + 1));
        const resultado = id
          ? await c.query<RegistroEstrutura>(
              `UPDATE organizacao.${tipo} SET ${colunas.map(([, coluna], i) => `${coluna}=${placeholders[i]}`).join(',')} WHERE empresa_id=$${valores.length + 1} AND id=$${valores.length + 2} RETURNING ${projecao(tipo)}`,
              [...valores, empresa, id],
            )
          : await c.query<RegistroEstrutura>(
              `INSERT INTO organizacao.${tipo}(${colunas.map(([, c]) => c).join(',')},empresa_id) VALUES(${placeholders.join(',')},$${valores.length + 1}) RETURNING ${projecao(tipo)}`,
              [...valores, empresa],
            );
        return exigir(resultado.rows[0]);
      },
    );
  }
  meusVinculos(ator: string): Promise<VinculoUsuario[]> {
    return this.banco.transacao(ator, async (c) => {
      await this.banco.exigirPerfilAtivo(c);
      return (
        await c.query<VinculoUsuario>(
          `SELECT ${PROJECAO_VINCULO} FROM ${ORIGEM_VINCULO} WHERE v.usuario_id=$1 ORDER BY v.criado_em`,
          [ator],
        )
      ).rows;
    });
  }
  editarVinculo(
    ator: string,
    empresa: string,
    id: string,
    matricula: string | null,
    status: StatusCadastro,
  ): Promise<VinculoUsuario> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      'usuarios:gerenciar',
      true,
      async (c) => {
        await obterVinculo(c, empresa, id);
        await c.query(
          'UPDATE organizacao.vinculos_organizacionais SET matricula=$1,status=$2 WHERE empresa_id=$3 AND id=$4',
          [normalizarMatricula(matricula), status, empresa, id],
        );
        return obterVinculo(c, empresa, id);
      },
    );
  }
  salvarLotacao(
    ator: string,
    empresa: string,
    id: string,
    dados: LotacaoUsuario & { status: StatusCadastro },
  ): Promise<VinculoUsuario> {
    validarLotacao(dados);
    return this.banco.comEmpresa(
      ator,
      empresa,
      'usuarios:gerenciar',
      true,
      async (c) => {
        await obterVinculo(c, empresa, id);
        const valores = [
          empresa,
          id,
          dados.estabelecimentoId ?? null,
          dados.setorId ?? null,
          dados.funcaoId ?? null,
          dados.turnoId ?? null,
          dados.status,
        ];
        await c.query(
          `INSERT INTO organizacao.lotacoes_usuario(empresa_id,vinculo_organizacional_id,estabelecimento_id,setor_id,funcao_id,turno_id,status) VALUES($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT(empresa_id,vinculo_organizacional_id) DO UPDATE SET estabelecimento_id=excluded.estabelecimento_id,setor_id=excluded.setor_id,funcao_id=excluded.funcao_id,turno_id=excluded.turno_id,status=excluded.status`,
          valores,
        );
        return obterVinculo(c, empresa, id);
      },
    );
  }
  atribuicoes(
    ator: string,
    empresa: string,
    vinculo: string,
  ): Promise<AtribuicaoPapel[]> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      'usuarios:gerenciar',
      false,
      async (c) => {
        await obterVinculo(c, empresa, vinculo);
        return (
          await c.query<AtribuicaoPapel>(
            `SELECT ${ATRIBUICAO} FROM organizacao.atribuicoes_papel WHERE empresa_id=$1 AND vinculo_organizacional_id=$2 ORDER BY criado_em`,
            [empresa, vinculo],
          )
        ).rows;
      },
    );
  }
  private async exigirOutroTitular(
    c: PoolClient,
    ator: string,
    empresa: string,
    vinculo: string,
  ) {
    const alvo = await obterVinculo(c, empresa, vinculo);
    if (alvo.usuarioId === ator)
      throw new ErroDeUsuario(
        'SEM_PERMISSAO',
        'Atribuições próprias exigem outro gestor autorizado.',
      );
    if (alvo.status !== 'ativo')
      throw new ErroDeUsuario(
        'DADOS_INVALIDOS',
        'Ative o vínculo antes de alterar seus papéis.',
      );
  }
  concederPapel(
    ator: string,
    empresa: string,
    vinculo: string,
    papel: PapelUsuario,
    motivo: string,
  ): Promise<AtribuicaoPapel> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      'usuarios:gerenciar',
      true,
      async (c) => {
        await this.exigirOutroTitular(c, ator, empresa, vinculo);
        return exigir(
          (
            await c.query<AtribuicaoPapel>(
              `INSERT INTO organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) VALUES($1,$2,$3,$4,$5) RETURNING ${ATRIBUICAO}`,
              [empresa, vinculo, papel, ator, motivo],
            )
          ).rows[0],
        );
      },
    );
  }
  revogarPapel(
    ator: string,
    empresa: string,
    vinculo: string,
    atribuicao: string,
    motivo: string,
  ): Promise<void> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      'usuarios:gerenciar',
      true,
      async (c) => {
        await this.exigirOutroTitular(c, ator, empresa, vinculo);
        const r = await c.query(
          `UPDATE organizacao.atribuicoes_papel SET status='inativo',motivo=$1 WHERE empresa_id=$2 AND vinculo_organizacional_id=$3 AND id=$4 AND status='ativo' RETURNING id`,
          [motivo, empresa, vinculo, atribuicao],
        );
        exigir(r.rows[0]);
      },
    );
  }
  snapshots(ator: string, empresa: string): Promise<EstruturaCongelada[]> {
    return this.banco.comEmpresa(ator, empresa, 'estrutura:ler', false, (c) =>
      this.listarSnapshots(c, empresa),
    );
  }
  private async listarSnapshots(
    c: PoolClient,
    empresa: string,
  ): Promise<EstruturaCongelada[]> {
    return (
      await c.query<EstruturaCongelada>(
        `SELECT id,empresa_id AS "empresaId",estabelecimento_id AS "estabelecimentoId",revisao,criado_em AS "criadoEm",populacao_total AS "populacaoTotal",conteudo->'grupos' AS grupos FROM organizacao.estruturas_congeladas WHERE empresa_id=$1 ORDER BY criado_em DESC`,
        [empresa],
      )
    ).rows;
  }
  congelar(
    ator: string,
    empresa: string,
    estabelecimento: string,
  ): Promise<EstruturaCongelada> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      'estrutura:gerenciar',
      true,
      async (c) => {
        const unidade = exigir(
          (
            await c.query<RegistroEstrutura>(
              `SELECT ${projecao('estabelecimentos')} FROM organizacao.estabelecimentos WHERE empresa_id=$1 AND id=$2 AND status='ativo'`,
              [empresa, estabelecimento],
            )
          ).rows[0],
        );
        const grupos = (
          await c.query<RegistroEstrutura>(
            `SELECT ${projecao('grupos')} FROM organizacao.grupos WHERE empresa_id=$1 AND estabelecimento_id=$2 AND status='ativo' ORDER BY id`,
            [empresa, estabelecimento],
          )
        ).rows;
        if (!grupos.length)
          throw new ErroDeUsuario(
            'DADOS_INVALIDOS',
            'Cadastre grupos ativos antes de congelar a estrutura.',
          );
        const setores = (
          await c.query<RegistroEstrutura>(
            `SELECT ${projecao('setores')} FROM organizacao.setores WHERE empresa_id=$1 AND estabelecimento_id=$2`,
            [empresa, estabelecimento],
          )
        ).rows;
        const funcoes = (
          await c.query<RegistroEstrutura>(
            `SELECT ${projecao('funcoes')} FROM organizacao.funcoes WHERE empresa_id=$1`,
            [empresa],
          )
        ).rows;
        const turnos = (
          await c.query<RegistroEstrutura>(
            `SELECT ${projecao('turnos')} FROM organizacao.turnos WHERE empresa_id=$1`,
            [empresa],
          )
        ).rows;
        for (const grupo of grupos) {
          if (
            !setores.some(
              (s) => s.id === grupo.setorId && s.status === 'ativo',
            ) ||
            (grupo.funcaoId &&
              !funcoes.some(
                (f) => f.id === grupo.funcaoId && f.status === 'ativo',
              )) ||
            (grupo.turnoId &&
              !turnos.some(
                (t) => t.id === grupo.turnoId && t.status === 'ativo',
              ))
          )
            throw new ErroDeUsuario(
              'DADOS_INVALIDOS',
              'Reative as referências dos grupos antes de congelar.',
            );
        }
        const total = grupos.reduce(
          (s, g) => s + (g.quantidadeEstimadaTrabalhadores ?? 0),
          0,
        );
        const conteudo = {
          estabelecimento: unidade,
          setores,
          funcoes: funcoes.filter((f) =>
            grupos.some((g) => g.funcaoId === f.id),
          ),
          turnos: turnos.filter((t) => grupos.some((g) => g.turnoId === t.id)),
          grupos,
        };
        const r = await c.query<{ id: string }>(
          `INSERT INTO organizacao.estruturas_congeladas(empresa_id,estabelecimento_id,revisao,populacao_total,conteudo,criado_por)
    SELECT $1,$2,coalesce(max(revisao),0)+1,$3,$4::jsonb,$5 FROM organizacao.estruturas_congeladas WHERE empresa_id=$1 AND estabelecimento_id=$2 RETURNING id`,
          [empresa, estabelecimento, total, JSON.stringify(conteudo), ator],
        );
        return exigir(
          (await this.listarSnapshots(c, empresa)).find(
            (s) => s.id === r.rows[0].id,
          ),
        );
      },
    );
  }
}
