import type {
  CadastroUsuario,
  EntradaVinculo,
  VincularUsuario,
  VinculoUsuario,
} from '@sistemanr1/contratos';
import type { Identidades, RepositorioUsuarios } from './portas-usuarios.js';
import { ErroDeUsuario, validarLotacao } from '../dominio/usuario.js';
import { normalizarMatricula } from '../dominio/organizacao.js';

function obterDadosDoVinculo(entrada: EntradaVinculo): EntradaVinculo {
  return {
    matriculaFuncional: normalizarMatricula(entrada.matriculaFuncional),
    papeis: entrada.papeis,
    motivo: entrada.motivo,
    ...(entrada.estabelecimentoId
      ? { estabelecimentoId: entrada.estabelecimentoId }
      : {}),
    ...(entrada.setorId ? { setorId: entrada.setorId } : {}),
    ...(entrada.funcaoId ? { funcaoId: entrada.funcaoId } : {}),
    ...(entrada.turnoId ? { turnoId: entrada.turnoId } : {}),
  };
}

export class ServicoUsuarios {
  constructor(
    private readonly identidades: Identidades,
    private readonly repositorio: RepositorioUsuarios,
  ) {}

  async cadastrar(
    atorId: string,
    empresaId: string,
    entrada: CadastroUsuario,
  ): Promise<VinculoUsuario> {
    validarLotacao(entrada);
    const vinculo = obterDadosDoVinculo(entrada);
    await this.repositorio.validarCadastro(atorId, empresaId, vinculo);
    const usuarioId = await this.identidades.criarUsuario({
      nomeCompleto: entrada.nomeCompleto,
      email: entrada.email,
      senha: entrada.senha,
    });
    try {
      return await this.repositorio.vincular(
        atorId,
        empresaId,
        usuarioId,
        vinculo,
      );
    } catch {
      throw new ErroDeUsuario(
        'CADASTRO_PARCIAL',
        'Identidade criada; não foi possível confirmar o vínculo. Verifique antes de repetir.',
        usuarioId,
      );
    }
  }

  async vincularExistente(
    atorId: string,
    empresaId: string,
    entrada: VincularUsuario,
  ): Promise<VinculoUsuario> {
    validarLotacao(entrada);
    return this.repositorio.vincular(
      atorId,
      empresaId,
      entrada.usuarioId,
      obterDadosDoVinculo(entrada),
    );
  }
}
