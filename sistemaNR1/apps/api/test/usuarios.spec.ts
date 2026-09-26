import { jest } from '@jest/globals';
import { ServicoUsuarios } from '../src/aplicacao/servico-usuarios.js';
import type {
  Identidades,
  RepositorioUsuarios,
} from '../src/aplicacao/portas-usuarios.js';
import { ErroDeUsuario, validarLotacao } from '../src/dominio/usuario.js';
import type {
  CadastroUsuario,
  EntradaVinculo,
  VinculoUsuario,
} from '@sistemanr1/contratos';

const ator = '10000000-0000-4000-8000-000000000001';
const empresa = '20000000-0000-4000-8000-000000000001';
const usuario = '30000000-0000-4000-8000-000000000001';
const entrada: CadastroUsuario = {
  nomeCompleto: 'Pessoa Fictícia',
  email: 'pessoa@example.invalid',
  senha: 'Senha-Ficticia-2026',
  matriculaFuncional: '001',
  papel: 'leitor',
};

function preparar() {
  const identidades = {
    autenticar: jest.fn<Identidades['autenticar']>(),
    criarUsuario: jest
      .fn<Identidades['criarUsuario']>()
      .mockResolvedValue(usuario),
  };
  const vinculo: VinculoUsuario = {
    usuarioId: usuario,
    empresaId: empresa,
    nomeCompleto: entrada.nomeCompleto,
    matriculaFuncional: '001',
    papel: 'leitor',
  };
  const repositorio = {
    listarEmpresas: jest.fn<RepositorioUsuarios['listarEmpresas']>(),
    obterOpcoes: jest.fn<RepositorioUsuarios['obterOpcoes']>(),
    listarUsuarios: jest.fn<RepositorioUsuarios['listarUsuarios']>(),
    validarCadastro: jest
      .fn<RepositorioUsuarios['validarCadastro']>()
      .mockResolvedValue(undefined),
    vincular: jest
      .fn<RepositorioUsuarios['vincular']>()
      .mockResolvedValue(vinculo),
  };
  return {
    identidades,
    repositorio,
    servico: new ServicoUsuarios(identidades, repositorio),
  };
}

describe('C0 — cadastro administrativo de usuários', () => {
  it('envia senha apenas à identidade e matrícula apenas ao vínculo', async () => {
    const { servico, identidades, repositorio } = preparar();
    const saida = await servico.cadastrar(ator, empresa, entrada);
    expect(identidades.criarUsuario).toHaveBeenCalledWith({
      nomeCompleto: entrada.nomeCompleto,
      email: entrada.email,
      senha: entrada.senha,
    });
    const dadosPersistidos = repositorio.vincular.mock.calls[0][3];
    expect(dadosPersistidos).toEqual({
      matriculaFuncional: '001',
      papel: 'leitor',
    });
    expect(JSON.stringify(dadosPersistidos)).not.toContain(entrada.senha);
    expect(saida).not.toHaveProperty('senha');
    expect(saida).not.toHaveProperty('email');
  });

  it.each([
    'SEM_PERMISSAO',
    'LOTACAO_INVALIDA',
    'MATRICULA_DUPLICADA',
  ] as const)('rejeita %s antes de criar identidade', async (codigo) => {
    const { servico, identidades, repositorio } = preparar();
    repositorio.validarCadastro.mockRejectedValue(
      new ErroDeUsuario(codigo, 'Solicitação recusada.'),
    );
    await expect(
      servico.cadastrar(ator, empresa, entrada),
    ).rejects.toHaveProperty('codigo', codigo);
    expect(identidades.criarUsuario).not.toHaveBeenCalled();
    expect(repositorio.vincular).not.toHaveBeenCalled();
  });

  it('falha de Auth não grava vínculo', async () => {
    const { servico, identidades, repositorio } = preparar();
    identidades.criarUsuario.mockRejectedValue(
      new ErroDeUsuario('IDENTIDADE_RECUSADA', 'Cadastro não concluído.'),
    );
    await expect(
      servico.cadastrar(ator, empresa, entrada),
    ).rejects.toHaveProperty('codigo', 'IDENTIDADE_RECUSADA');
    expect(repositorio.vincular).not.toHaveBeenCalled();
  });

  it('informa resultado parcial sem apagar identidade ou conceder acesso por fallback', async () => {
    const { servico, repositorio } = preparar();
    repositorio.vincular.mockRejectedValue(
      new Error('Detalhe interno que não pode sair'),
    );
    await expect(
      servico.cadastrar(ator, empresa, entrada),
    ).rejects.toMatchObject({
      codigo: 'CADASTRO_PARCIAL',
      usuarioIdCriado: usuario,
      message:
        'Identidade criada; não foi possível confirmar o vínculo. Verifique antes de repetir.',
    });
    expect(repositorio.vincular).toHaveBeenCalledTimes(1);
  });

  it('associa identidade existente a outra empresa com matrícula própria, sem trocar credenciais', async () => {
    const { servico, identidades, repositorio } = preparar();
    const outraEmpresa = '20000000-0000-4000-8000-000000000002';
    await servico.vincularExistente(ator, outraEmpresa, {
      usuarioId: usuario,
      matriculaFuncional: '072',
      papel: 'tecnico',
    });
    expect(repositorio.vincular).toHaveBeenCalledWith(
      ator,
      outraEmpresa,
      usuario,
      { matriculaFuncional: '072', papel: 'tecnico' },
    );
    expect(identidades.criarUsuario).not.toHaveBeenCalled();
  });

  it('aceita ausência de lotação e exige estabelecimento quando há setor', () => {
    expect(() => validarLotacao({})).not.toThrow();
    expect(() => validarLotacao({ setorId: usuario })).toThrow(ErroDeUsuario);
  });

  it('não permite que campos extras vazem do cadastro para a persistência', async () => {
    const { servico, repositorio } = preparar();
    await servico.cadastrar(ator, empresa, {
      ...entrada,
      senha: 'Outro-Segredo-Ficticio',
    });
    const dados: EntradaVinculo = repositorio.vincular.mock.calls[0][3];
    expect(Object.keys(dados).sort()).toEqual(['matriculaFuncional', 'papel']);
  });
});
