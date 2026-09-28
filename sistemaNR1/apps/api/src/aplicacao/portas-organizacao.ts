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

export abstract class RepositorioOrganizacao {
  abstract perfil(atorId: string): Promise<PerfilUsuario | null>;
  abstract atualizarPerfil(
    atorId: string,
    nome: string,
    reconciliar: boolean,
  ): Promise<PerfilUsuario>;
  abstract profissionais(atorId: string): Promise<IdentificacaoProfissional[]>;
  abstract salvarProfissional(
    atorId: string,
    dados: DadosProfissionais,
    id?: string,
  ): Promise<IdentificacaoProfissional>;
  abstract criarEmpresa(atorId: string, dados: DadosEmpresa): Promise<Empresa>;
  abstract empresa(atorId: string, empresaId: string): Promise<Empresa>;
  abstract editarEmpresa(
    atorId: string,
    empresaId: string,
    dados: DadosEmpresa & { status: StatusCadastro },
  ): Promise<Empresa>;
  abstract estrutura(
    atorId: string,
    empresaId: string,
    tipo: TipoEstrutura,
  ): Promise<RegistroEstrutura[]>;
  abstract salvarEstrutura(
    atorId: string,
    empresaId: string,
    tipo: TipoEstrutura,
    dados: DadosEstrutura,
    id?: string,
  ): Promise<RegistroEstrutura>;
  abstract meusVinculos(atorId: string): Promise<VinculoUsuario[]>;
  abstract editarVinculo(
    atorId: string,
    empresaId: string,
    id: string,
    matricula: string | null,
    status: StatusCadastro,
  ): Promise<VinculoUsuario>;
  abstract salvarLotacao(
    atorId: string,
    empresaId: string,
    id: string,
    dados: LotacaoUsuario & { status: StatusCadastro },
  ): Promise<VinculoUsuario>;
  abstract atribuicoes(
    atorId: string,
    empresaId: string,
    vinculoId: string,
  ): Promise<AtribuicaoPapel[]>;
  abstract concederPapel(
    atorId: string,
    empresaId: string,
    vinculoId: string,
    papel: PapelUsuario,
    motivo: string,
  ): Promise<AtribuicaoPapel>;
  abstract revogarPapel(
    atorId: string,
    empresaId: string,
    vinculoId: string,
    atribuicaoId: string,
    motivo: string,
  ): Promise<void>;
  abstract snapshots(
    atorId: string,
    empresaId: string,
  ): Promise<EstruturaCongelada[]>;
  abstract congelar(
    atorId: string,
    empresaId: string,
    estabelecimentoId: string,
  ): Promise<EstruturaCongelada>;
}
