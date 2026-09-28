import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarAplicacao } from '../src/infraestrutura/configurar-aplicacao.js';
import {
  Identidades,
  RepositorioUsuarios,
} from '../src/aplicacao/portas-usuarios.js';
import { ErroDeUsuario } from '../src/dominio/usuario.js';

const empresaId = '20000000-0000-4000-8000-000000000001';
const usuarioId = '10000000-0000-4000-8000-000000000001';
const novoId = '30000000-0000-4000-8000-000000000001';
const rota = `/api/v1/empresas/${empresaId}/usuarios`;
const entrada = {
  nomeCompleto: 'Pessoa Fictícia',
  email: 'pessoa@example.invalid',
  senha: 'Senha-Ficticia-2026',
  motivo: 'Cadastro fictício autorizado',
  matriculaFuncional: '001',
  papeis: ['trabalhador'],
};
const identidades = {
  autenticar: jest.fn<Identidades['autenticar']>(),
  criarUsuario: jest.fn<Identidades['criarUsuario']>(),
};
const repositorio = {
  listarEmpresas: jest.fn<RepositorioUsuarios['listarEmpresas']>(),
  obterOpcoes: jest.fn<RepositorioUsuarios['obterOpcoes']>(),
  listarUsuarios: jest.fn<RepositorioUsuarios['listarUsuarios']>(),
  validarCadastro: jest.fn<RepositorioUsuarios['validarCadastro']>(),
  vincular: jest.fn<RepositorioUsuarios['vincular']>(),
};

describe('C0 — contrato HTTP e autorização (portas substituídas; não prova RLS)', () => {
  let aplicacao: INestApplication<Server>;
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Identidades)
      .useValue(identidades)
      .overrideProvider(RepositorioUsuarios)
      .useValue(repositorio)
      .compile();
    aplicacao = modulo.createNestApplication({ logger: false });
    configurarAplicacao(aplicacao);
    await aplicacao.init();
  });
  afterAll(async () => {
    await aplicacao.close();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    identidades.autenticar.mockResolvedValue(usuarioId);
    identidades.criarUsuario.mockResolvedValue(novoId);
    repositorio.validarCadastro.mockResolvedValue(undefined);
    repositorio.vincular.mockResolvedValue({
      id: novoId,
      status: 'ativo',
      usuarioId: novoId,
      empresaId,
      nomeCompleto: entrada.nomeCompleto,
      matriculaFuncional: '001',
      papeis: ['trabalhador'],
    });
  });

  it('nega ausência de token antes de acessar cadastro', async () => {
    await request(aplicacao.getHttpServer())
      .post(rota)
      .send(entrada)
      .expect(401);
    expect(identidades.autenticar).not.toHaveBeenCalled();
    expect(repositorio.validarCadastro).not.toHaveBeenCalled();
  });
  it('nega token recusado por Auth', async () => {
    identidades.autenticar.mockRejectedValue(
      new ErroDeUsuario('NAO_AUTENTICADO', 'Sessão inválida.'),
    );
    const resposta = await request(aplicacao.getHttpServer())
      .post(rota)
      .set('Authorization', 'Bearer token-ficticio')
      .send(entrada)
      .expect(401);
    expect(resposta.text).not.toContain('token-ficticio');
    expect(identidades.criarUsuario).not.toHaveBeenCalled();
  });
  it.each([
    { nomeCompleto: 'A' },
    { email: 'invalido' },
    { senha: 'curta' },
    { senha: 'x'.repeat(129) },
    { papeis: ['trabalhador', 'trabalhador'] },
    { matriculaFuncional: 'x'.repeat(51) },
    { papel: 'admin' },
    { setorId: 'invalido' },
    { empresaId: 'outra' },
    { usuarioId: novoId },
  ])(
    'rejeita entrada inválida ou tentativa de injetar contexto: %j',
    async (alteracao) => {
      const resposta = await request(aplicacao.getHttpServer())
        .post(rota)
        .set('Authorization', 'Bearer ficticio')
        .send({ ...entrada, ...alteracao })
        .expect(400);
      expect(resposta.text).not.toContain(entrada.senha);
      expect(identidades.criarUsuario).not.toHaveBeenCalled();
    },
  );
  it('rejeita setor sem estabelecimento', async () => {
    await request(aplicacao.getHttpServer())
      .post(rota)
      .set('Authorization', 'Bearer ficticio')
      .send({ ...entrada, setorId: novoId })
      .expect(400);
    expect(identidades.criarUsuario).not.toHaveBeenCalled();
  });
  it('aceita matrícula vazia e normaliza para NULL no vínculo', async () => {
    await request(aplicacao.getHttpServer())
      .post(rota)
      .set('Authorization', 'Bearer ficticio')
      .send({ ...entrada, matriculaFuncional: '   ' })
      .expect(201);
    expect(repositorio.vincular).toHaveBeenCalledWith(
      usuarioId,
      empresaId,
      novoId,
      expect.objectContaining({
        matriculaFuncional: null,
        papeis: ['trabalhador'],
      }),
    );
  });
  it('nega gestor sem vínculo ativo na empresa alvo antes de criar conta', async () => {
    repositorio.validarCadastro.mockRejectedValue(
      new ErroDeUsuario('SEM_PERMISSAO', 'Acesso negado.'),
    );
    await request(aplicacao.getHttpServer())
      .post(rota)
      .set('Authorization', 'Bearer ficticio')
      .send(entrada)
      .expect(403);
    expect(repositorio.validarCadastro).toHaveBeenCalledWith(
      usuarioId,
      empresaId,
      expect.any(Object),
    );
    expect(identidades.criarUsuario).not.toHaveBeenCalled();
  });
  it('cadastra com identificador da sessão e não devolve senha', async () => {
    const resposta = await request(aplicacao.getHttpServer())
      .post(rota)
      .set('Authorization', 'Bearer ficticio')
      .send({ ...entrada, nomeCompleto: '  Pessoa Fictícia  ' })
      .expect(201);
    expect(resposta.body).toMatchObject({
      usuarioId: novoId,
      matriculaFuncional: '001',
    });
    expect(resposta.body).not.toHaveProperty('senha');
    expect(resposta.text).not.toContain(entrada.senha);
    expect(identidades.criarUsuario).toHaveBeenCalledWith({
      nomeCompleto: 'Pessoa Fictícia',
      email: entrada.email,
      senha: entrada.senha,
    });
  });
  it('rejeita senha/e-mail/nome no vínculo de usuário existente', async () => {
    await request(aplicacao.getHttpServer())
      .post(`/api/v1/empresas/${empresaId}/vinculos`)
      .set('Authorization', 'Bearer ficticio')
      .send({
        usuarioId: novoId,
        matriculaFuncional: '072',
        papeis: ['trabalhador'],
        senha: entrada.senha,
      })
      .expect(400);
    expect(repositorio.vincular).not.toHaveBeenCalled();
  });
  it('consulta opções somente no contexto autenticado', async () => {
    repositorio.obterOpcoes.mockResolvedValue({
      estabelecimentos: [],
      setores: [],
      funcoes: [],
      turnos: [],
    });
    await request(aplicacao.getHttpServer())
      .get(rota + '/opcoes')
      .set('Authorization', 'Bearer ficticio')
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(repositorio.obterOpcoes).toHaveBeenCalledWith(usuarioId, empresaId);
  });
});
