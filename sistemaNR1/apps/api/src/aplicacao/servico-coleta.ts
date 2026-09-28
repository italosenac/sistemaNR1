import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { BancoOrganizacao } from '../infraestrutura/banco-organizacao.js';
import { ErroDeUsuario } from '../dominio/usuario.js';
import { validarPublicacao } from '../dominio/campanha.js';
import type {
  AdicionarGrupoDto,
  CriarCampanhaDto,
} from '../apresentacao/coleta.dto.js';

@Injectable()
export class ServicoColeta {
  constructor(
    @Inject(BancoOrganizacao) private readonly banco: BancoOrganizacao,
  ) {}

  async criar(ator: string, empresa: string, dados: CriarCampanhaDto) {
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      const resultado = await cliente.query<{ id: string }>(
        `INSERT INTO coleta.campanhas(empresa_id,estabelecimento_id,titulo,inicio,fim,fuso,
          meta_percentual,canal_divulgacao,canal_alternativo,criado_por)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          empresa,
          dados.estabelecimentoId,
          dados.titulo.trim(),
          dados.inicio,
          dados.fim,
          dados.fuso,
          dados.metaPercentual,
          dados.canalDivulgacao.trim(),
          dados.canalAlternativo.trim(),
          ator,
        ],
      );
      return { id: resultado.rows[0].id };
    });
  }

  async listar(ator: string, empresa: string) {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async (cliente) => {
        const resultado = await cliente.query(
          `SELECT id,titulo,estado,estabelecimento_id AS "estabelecimentoId",inicio,fim,fuso
          FROM coleta.campanhas WHERE empresa_id=$1 ORDER BY criado_em DESC`,
          [empresa],
        );
        return resultado.rows;
      },
    );
  }

  async adicionarGrupo(
    ator: string,
    empresa: string,
    campanha: string,
    dados: AdicionarGrupoDto,
  ) {
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      await this.exigirCampanha(cliente, empresa, campanha);
      await cliente.query('SELECT coleta.adicionar_grupo($1,$2,$3)', [
        campanha,
        dados.grupoId,
        dados.populacaoEsperada,
      ]);
      return { adicionado: true };
    });
  }

  async publicar(
    ator: string,
    empresa: string,
    campanha: string,
    fotografia: string,
  ) {
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      const linha = await cliente.query<{
        titulo: string;
        inicio: Date;
        fim: Date;
        fuso: string;
        meta_percentual: string;
        minimo_divulgacao: number;
        canal_alternativo: string;
        populacao: string;
      }>(
        `SELECT c.titulo,c.inicio,c.fim,c.fuso,c.meta_percentual,c.minimo_divulgacao,
          c.canal_alternativo,COALESCE(sum(g.populacao_esperada),0)::text populacao
          FROM coleta.campanhas c LEFT JOIN coleta.grupos_campanha g
          ON g.empresa_id=c.empresa_id AND g.campanha_id=c.id
          WHERE c.empresa_id=$1 AND c.id=$2
          GROUP BY c.id`,
        [empresa, campanha],
      );
      const dados = linha.rows[0];
      if (!dados)
        throw new ErroDeUsuario('NAO_ENCONTRADO', 'Campanha indisponível.');
      try {
        validarPublicacao({
          titulo: dados.titulo,
          inicio: dados.inicio.toISOString(),
          fim: dados.fim.toISOString(),
          fuso: dados.fuso,
          metaPercentual: Number(dados.meta_percentual),
          populacaoEsperada: Number(dados.populacao),
          minimoDivulgacao: dados.minimo_divulgacao,
          canalAlternativo: dados.canal_alternativo,
        });
      } catch {
        throw new ErroDeUsuario(
          'DADOS_INVALIDOS',
          'Campanha incompleta para publicação.',
        );
      }
      await cliente.query('SELECT coleta.publicar_campanha($1,$2)', [
        campanha,
        fotografia,
      ]);
      return { publicada: true };
    });
  }

  async emitirCodigo(
    ator: string,
    empresa: string,
    campanha: string,
    grupo: string,
  ) {
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      await this.exigirCampanha(cliente, empresa, campanha);
      const codigo = randomBytes(32).toString('hex');
      const hash = createHash('sha256').update(codigo).digest('hex');
      await cliente.query('SELECT coleta.emitir_codigo($1,$2,$3)', [
        campanha,
        grupo,
        hash,
      ]);
      return { codigo };
    });
  }

  async encerrar(ator: string, empresa: string, campanha: string) {
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      await this.exigirCampanha(cliente, empresa, campanha);
      const resultado = await cliente.query<{ id: string }>(
        'SELECT coleta.encerrar_com_agregado($1) id',
        [campanha],
      );
      return { registroConsultaId: resultado.rows[0].id };
    });
  }

  async agregado(ator: string, empresa: string, campanha: string) {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async (cliente) => {
        await this.exigirCampanha(cliente, empresa, campanha);
        const resultado = await cliente.query<{
          pacote: Record<string, unknown>;
        }>('SELECT coleta.pacote_agregado($1) pacote', [campanha]);
        return resultado.rows[0].pacote;
      },
    );
  }

  private async exigirCampanha(
    cliente: PoolClient,
    empresa: string,
    campanha: string,
  ) {
    const resultado = await cliente.query(
      'SELECT 1 FROM coleta.campanhas WHERE empresa_id=$1 AND id=$2',
      [empresa, campanha],
    );
    if (resultado.rowCount !== 1)
      throw new ErroDeUsuario('NAO_ENCONTRADO', 'Campanha indisponível.');
  }
}
