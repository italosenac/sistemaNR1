import { Inject, Injectable } from '@nestjs/common';
import { BancoOrganizacao } from '../infraestrutura/banco-organizacao.js';
import { ErroDeUsuario } from '../dominio/usuario.js';
import {
  calcularAvaliacao,
  matrizDemonstrativa,
  validarMatriz,
} from '../dominio/matriz-risco.js';
import type { MatrizRisco } from '../dominio/matriz-risco.js';
import {
  gerarPdfRascunho,
  hashSha256,
} from '../infraestrutura/pdf-rascunho.js';
import type {
  PublicarCriterioDto,
  RegistrarAvaliacaoDto,
} from '../apresentacao/avaliacao.dto.js';

@Injectable()
export class ServicoAvaliacao {
  constructor(
    @Inject(BancoOrganizacao) private readonly banco: BancoOrganizacao,
  ) {}

  async modelo(ator: string, empresa: string) {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async () => matrizDemonstrativa,
    );
  }

  async publicarCriterio(
    ator: string,
    empresa: string,
    dados: PublicarCriterioDto,
  ) {
    let matriz: MatrizRisco;
    try {
      matriz = dados.matriz as unknown as MatrizRisco;
      validarMatriz(matriz);
    } catch {
      throw new ErroDeUsuario(
        'DADOS_INVALIDOS',
        'A matriz deve conter todas as células e decisões.',
      );
    }
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      const informacoes = await cliente.query<{
        razao_social: string;
        versao: number;
        hash: string;
      }>(
        `SELECT e.razao_social,
          (SELECT coalesce(max(c.versao),0)+1 FROM avaliacao.criterios_versoes c WHERE c.empresa_id=e.id) versao,
          avaliacao.hash_matriz($2::jsonb) hash
          FROM organizacao.empresas e WHERE e.id=$1`,
        [empresa, JSON.stringify(matriz)],
      );
      const info = informacoes.rows[0];
      if (!info)
        throw new ErroDeUsuario('NAO_ENCONTRADO', 'Empresa indisponível.');
      const pdf = gerarPdfRascunho('Criterios de avaliacao - M2', [
        `Empresa: ${info.razao_social}`,
        `Versao: ${info.versao} | Data: ${new Date().toISOString()}`,
        'Metodo demonstrativo: R = S x P. S e P sao escolhas tecnicas justificadas.',
        'Escalas: severidade 1, 2, 3; probabilidade 1, 2, 3.',
        `SHA-256 do conteudo da matriz: ${info.hash}`,
        'Celulas (S x P | faixa | decisao):',
        ...matriz.celulas.map(
          (c) =>
            `${c.severidade} x ${c.probabilidade} | ${c.faixa} | ${c.decisao}`,
        ),
        `Responsavel tecnico academico (ID): ${ator}`,
        'Assinatura formal: __________________________________',
        'Aprovacao academica nao equivale a assinatura formal.',
      ]);
      const hashPdf = hashSha256(pdf);
      const resultado = await cliente.query<{ id: string }>(
        'SELECT avaliacao.publicar_criterio($1,$2::jsonb,$3,$4,$5) id',
        [empresa, JSON.stringify(matriz), info.hash, pdf, hashPdf],
      );
      return {
        id: resultado.rows[0].id,
        versao: info.versao,
        hashConteudo: info.hash,
        hashPdf,
        assinaturaEstado: 'nao_assinado',
      };
    });
  }

  async listarCriterios(ator: string, empresa: string) {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async (cliente) => {
        const resultado = await cliente.query(
          `SELECT id,versao,hash_conteudo AS "hashConteudo",hash_pdf AS "hashPdf",
          assinatura_estado AS "assinaturaEstado",aprovado_em AS "aprovadoEm"
          FROM avaliacao.criterios_versoes WHERE empresa_id=$1 ORDER BY versao DESC`,
          [empresa],
        );
        return resultado.rows;
      },
    );
  }

  async pdfCriterio(
    ator: string,
    empresa: string,
    criterio: string,
  ): Promise<Buffer> {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async (cliente) => {
        const resultado = await cliente.query<{ arquivo: Buffer }>(
          'SELECT avaliacao.pdf_criterio($1,$2) arquivo',
          [empresa, criterio],
        );
        return resultado.rows[0].arquivo;
      },
    );
  }

  async registrar(ator: string, empresa: string, dados: RegistrarAvaliacaoDto) {
    return this.banco.comEmpresa(ator, empresa, null, true, async (cliente) => {
      const origem = await cliente.query<{
        pacote: {
          empresaId: string;
          fotografiaId: string;
          resultado: {
            particoes: Array<{
              fatorId: string;
              escopoTipo: string;
              escopoId: string;
            }>;
          };
        };
      }>('SELECT coleta.pacote_agregado($1) pacote', [dados.campanhaId]);
      const pacote = origem.rows[0]?.pacote;
      const particao = pacote?.resultado.particoes.find(
        (item) =>
          item.fatorId === dados.fatorId &&
          item.escopoTipo === dados.escopoTipo &&
          item.escopoId === dados.escopoId,
      );
      if (pacote?.empresaId !== empresa || !particao)
        throw new ErroDeUsuario(
          'DADOS_INVALIDOS',
          'O recorte agregado não está disponível.',
        );
      const criterios = await cliente.query<{ matriz: MatrizRisco }>(
        'SELECT matriz FROM avaliacao.criterios_versoes WHERE empresa_id=$1 AND id=$2',
        [empresa, dados.criterioId],
      );
      const matriz = criterios.rows[0]?.matriz;
      if (!matriz)
        throw new ErroDeUsuario(
          'DADOS_INVALIDOS',
          'Critério aprovado indisponível.',
        );
      let calculo: ReturnType<typeof calcularAvaliacao>;
      try {
        calculo = calcularAvaliacao(
          {
            fatorId: dados.fatorId,
            escopoId: dados.escopoId,
            agregadoPublicavel: true,
            severidade: dados.severidade,
            probabilidade: dados.probabilidade,
            justificativaProbabilidade: dados.justificativaProbabilidade,
            consequencias: dados.consequencias,
            indiceDeterminante: dados.indiceDeterminante,
            justificativaEmpate: dados.justificativaEmpate,
            riscoEvidente: dados.riscoEvidente,
            medidaRegistrada: dados.medidaRegistrada,
            ergonomia: dados.ergonomia,
            referenciaErgonomia: dados.referenciaErgonomia,
            decisaoExcepcional: dados.decisaoExcepcional,
            justificativaExcecao: dados.justificativaExcecao,
          },
          matriz,
        );
      } catch {
        throw new ErroDeUsuario(
          'DADOS_INVALIDOS',
          'Fundamentação técnica incompleta.',
        );
      }
      const tecnicos = {
        consequencias: dados.consequencias,
        justificativaProbabilidade: dados.justificativaProbabilidade,
        ergonomia: dados.ergonomia,
        referenciaErgonomia: dados.referenciaErgonomia ?? null,
        riscoEvidente: dados.riscoEvidente,
        medidaRegistrada: dados.medidaRegistrada ?? null,
        justificativaExcecao: dados.justificativaExcecao ?? null,
      };
      const resultado = await cliente.query<{ id: string }>(
        `SELECT avaliacao.registrar_resultado($1,$2,$3,$4,$5,$6,$7,$8::jsonb,
          $9,$10,$11,$12,$13,$14,$15::jsonb) id`,
        [
          empresa,
          pacote.fotografiaId,
          dados.criterioId,
          dados.fatorId,
          dados.escopoTipo,
          dados.escopoId,
          dados.perigo,
          JSON.stringify(tecnicos),
          dados.severidade,
          dados.probabilidade,
          calculo.valor,
          calculo.faixa,
          calculo.decisaoOriginal,
          calculo.decisaoEfetiva,
          JSON.stringify(calculo.memoria),
        ],
      );
      return {
        id: resultado.rows[0].id,
        ...calculo,
        criterioId: dados.criterioId,
        fotografiaId: pacote.fotografiaId,
      };
    });
  }

  async listarResultados(ator: string, empresa: string) {
    return this.banco.comEmpresa(
      ator,
      empresa,
      null,
      false,
      async (cliente) => {
        const resultado = await cliente.query(
          `SELECT id,estabelecimento_id AS "estabelecimentoId",fotografia_id AS "fotografiaId",
          criterio_id AS "criterioId",fator_id AS "fatorId",escopo_tipo AS "escopoTipo",
          escopo_id AS "escopoId",perigo,dados_tecnicos AS "dadosTecnicos",severidade,
          probabilidade,valor,faixa,decisao_original AS "decisaoOriginal",
          decisao_efetiva AS "decisaoEfetiva",memoria,criado_em AS "criadoEm"
          FROM avaliacao.resultados WHERE empresa_id=$1 ORDER BY criado_em DESC`,
          [empresa],
        );
        return resultado.rows;
      },
    );
  }
}
