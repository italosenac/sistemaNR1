import type {
  CadastroUsuario,
  EmpresaPermitida,
  EntradaVinculo,
  OpcoesLotacao,
  VinculoUsuario,
} from '@sistemanr1/contratos';

export abstract class Identidades {
  abstract autenticar(token: string): Promise<string>;
  abstract criarUsuario(
    entrada: Pick<CadastroUsuario, 'nomeCompleto' | 'email' | 'senha'>,
  ): Promise<string>;
}
export abstract class RepositorioUsuarios {
  abstract listarEmpresas(atorId: string): Promise<EmpresaPermitida[]>;
  abstract obterOpcoes(
    atorId: string,
    empresaId: string,
  ): Promise<OpcoesLotacao>;
  abstract listarUsuarios(
    atorId: string,
    empresaId: string,
  ): Promise<VinculoUsuario[]>;
  abstract validarCadastro(
    atorId: string,
    empresaId: string,
    entrada: EntradaVinculo,
  ): Promise<void>;
  abstract vincular(
    atorId: string,
    empresaId: string,
    usuarioId: string,
    entrada: EntradaVinculo,
  ): Promise<VinculoUsuario>;
}
