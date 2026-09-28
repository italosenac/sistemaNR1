import { Inject, Injectable } from '@nestjs/common';
import { BancoOrganizacao } from '../infraestrutura/banco-organizacao.js';
import { ErroDeUsuario } from '../dominio/usuario.js';
import {
  gerarPdfRascunho,
  hashSha256,
} from '../infraestrutura/pdf-rascunho.js';
import type { ConsolidarInventarioDto } from '../apresentacao/inventario.dto.js';

@Injectable()
export class ServicoInventario {
  constructor(
    @Inject(BancoOrganizacao) private readonly banco: BancoOrganizacao,
  ) {}

  async consolidar(
    ator: string,
    empresa: string,
    dados: ConsolidarInventarioDto,
  ) {
    if (!dados.itensPsicossociais.length || !dados.itensGerais.length)
      throw new ErroDeUsuario(
        'DADOS_INVALIDOS',
        'O inventário precisa integrar riscos gerais e psicossociais.',
      );
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      const informacoes = await cliente.query<{
        razao_social: string;
        nome: string;
        versao: number;
      }>(
        `SELECT e.razao_social,u.nome,
          (SELECT coalesce(max(v.versao),0)+1 FROM inventario.versoes v
            WHERE v.empresa_id=e.id AND v.estabelecimento_id=u.id) versao
          FROM organizacao.empresas e JOIN organizacao.estabelecimentos u
            ON u.empresa_id=e.id WHERE e.id=$1 AND u.id=$2 AND u.status='ativo'`,
        [empresa, dados.estabelecimentoId],
      );
      const info = informacoes.rows[0];
      if (!info)
        throw new ErroDeUsuario(
          'DADOS_INVALIDOS',
          'Estabelecimento indisponível.',
        );
      const registros = [];
      for (const item of dados.itensPsicossociais) {
        const consulta = await cliente.query<{
          registro: Record<string, unknown>;
        }>(
          `SELECT to_jsonb(r) registro FROM avaliacao.resultados r
            WHERE r.empresa_id=$1 AND r.estabelecimento_id=$2 AND r.id=$3`,
          [empresa, dados.estabelecimentoId, item.avaliacaoId],
        );
        if (!consulta.rows[0])
          throw new ErroDeUsuario(
            'DADOS_INVALIDOS',
            'Avaliação M2 indisponível para este estabelecimento.',
          );
        registros.push({
          alineas: item.alineas,
          avaliacao: consulta.rows[0].registro,
        });
      }
      const conteudo = {
        tipo: 'inventario-geral-demonstrativo-v1',
        empresaId: empresa,
        estabelecimentoId: dados.estabelecimentoId,
        itensPsicossociais: registros,
        itensGerais: dados.itensGerais,
      };
      const hash = (
        await cliente.query<{ hash: string }>(
          'SELECT avaliacao.hash_matriz($1::jsonb) hash',
          [JSON.stringify(conteudo)],
        )
      ).rows[0].hash;
      const linhas = [
        `Empresa: ${info.razao_social} | Estabelecimento: ${info.nome}`,
        `Versao: ${info.versao} | Data: ${new Date().toISOString()}`,
        `SHA-256 do conteudo integrado: ${hash}`,
        'Os valores abaixo sao copiados de M2 sem recalculo.',
      ];
      for (const [indice, item] of registros.entries()) {
        linhas.push(
          `RISCO PSICOSSOCIAL ${indice + 1} | avaliacao ${dados.itensPsicossociais[indice].avaliacaoId}`,
        );
        linhas.push(
          `Valor: ${item.avaliacao.valor} | faixa: ${item.avaliacao.faixa} | decisao: ${item.avaliacao.decisao_efetiva}`,
        );
        for (const [letra, valor] of Object.entries(item.alineas))
          linhas.push(`${letra}) ${valor}`);
      }
      for (const [indice, item] of dados.itensGerais.entries()) {
        linhas.push(
          `RISCO GERAL FICTICIO ${indice + 1} | categoria: ${item.categoria}`,
        );
        linhas.push(`Proveniencia: ${item.proveniencia}`);
        for (const [letra, valor] of Object.entries(item.alineas))
          linhas.push(`${letra}) ${valor}`);
      }
      linhas.push(
        `Responsavel tecnico academico (ID): ${ator}`,
        'Assinatura formal: _________________________________',
        'Documento demonstrativo sem assinatura formal.',
      );
      const pdf = gerarPdfRascunho('Inventario geral integrado', linhas);
      const hashPdf = hashSha256(pdf);
      const resultado = await cliente.query<{ id: string }>(
        'SELECT inventario.consolidar($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7) id',
        [
          empresa,
          dados.estabelecimentoId,
          JSON.stringify(dados.itensPsicossociais),
          JSON.stringify(dados.itensGerais),
          pdf,
          hashPdf,
          hash,
        ],
      );
      return {
        id: resultado.rows[0].id,
        versao: info.versao,
        hashConteudo: hash,
        hashPdf,
        assinaturaEstado: 'nao_assinado',
      };
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
          `SELECT id,estabelecimento_id AS "estabelecimentoId",versao,
          hash_conteudo AS "hashConteudo",hash_pdf AS "hashPdf",
          assinatura_estado AS "assinaturaEstado",diferencas,criado_em AS "criadoEm"
          FROM inventario.versoes WHERE empresa_id=$1
          ORDER BY estabelecimento_id,versao DESC`,
          [empresa],
        );
        return resultado.rows;
      },
    );
  }

  async obter(ator: string, empresa: string, id: string) {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async (cliente) => {
        const resultado = await cliente.query(
          `SELECT id,versao,conteudo,diferencas,hash_conteudo AS "hashConteudo",
          hash_pdf AS "hashPdf",assinatura_estado AS "assinaturaEstado"
          FROM inventario.versoes WHERE empresa_id=$1 AND id=$2`,
          [empresa, id],
        );
        if (!resultado.rows[0])
          throw new ErroDeUsuario('NAO_ENCONTRADO', 'Versão indisponível.');
        return resultado.rows[0];
      },
    );
  }

  async pdf(ator: string, empresa: string, id: string): Promise<Buffer> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async (cliente) => {
        const resultado = await cliente.query<{ arquivo: Buffer }>(
          'SELECT inventario.pdf_versao($1,$2) arquivo',
          [empresa, id],
        );
        return resultado.rows[0].arquivo;
      },
    );
  }
}
