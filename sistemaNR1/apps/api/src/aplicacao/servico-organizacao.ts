import type {
  DadosEmpresa,
  DadosEstrutura,
  StatusCadastro,
  TipoEstrutura,
} from '@sistemanr1/contratos';
import type { RepositorioOrganizacao } from './portas-organizacao.js';
import {
  validarCnpj,
  validarGrupo,
  validarTurno,
} from '../dominio/organizacao.js';
import { ErroDeUsuario, validarLotacao } from '../dominio/usuario.js';

export class ServicoOrganizacao {
  constructor(readonly repositorio: RepositorioOrganizacao) {}
  criarEmpresa(ator: string, entrada: DadosEmpresa) {
    return this.repositorio.criarEmpresa(ator, {
      ...entrada,
      cnpj: validarCnpj(entrada.cnpj),
    });
  }
  editarEmpresa(
    ator: string,
    empresa: string,
    entrada: DadosEmpresa & { status: StatusCadastro },
  ) {
    return this.repositorio.editarEmpresa(ator, empresa, {
      ...entrada,
      cnpj: validarCnpj(entrada.cnpj),
    });
  }
  salvarEstrutura(
    ator: string,
    empresa: string,
    tipo: TipoEstrutura,
    entrada: DadosEstrutura,
    id?: string,
  ) {
    if (tipo === 'setores' && !entrada.estabelecimentoId)
      throw new ErroDeUsuario(
        'DADOS_INVALIDOS',
        'Selecione o estabelecimento.',
      );
    if (tipo === 'grupos') {
      validarLotacao(entrada);
      validarGrupo(entrada, []);
    }
    if (tipo === 'turnos')
      validarTurno(entrada.horarioInicio, entrada.horarioFim);
    return this.repositorio.salvarEstrutura(ator, empresa, tipo, entrada, id);
  }
}
