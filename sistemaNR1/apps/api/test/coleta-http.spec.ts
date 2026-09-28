import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { BancoOrganizacao } from '../src/infraestrutura/banco-organizacao.js';
import { configurarAplicacao } from '../src/infraestrutura/configurar-aplicacao.js';

describe('M1 — entrada HTTP sem identificação nominal', () => {
  let aplicacao: INestApplication<Server>;
  const consultas: { texto: string; parametros: unknown[] }[] = [];
  const banco = {
    transacaoAnonima: async (
      executar: (cliente: {
        query: (texto: string, parametros: unknown[]) => Promise<void>;
      }) => Promise<void>,
    ) =>
      executar({
        query: async (texto: string, parametros: unknown[]) => {
          consultas.push({ texto, parametros });
        },
      }),
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          NODE_ENV: 'test',
          PORT: 3001,
          FRONTEND_URL: 'http://localhost:3000',
        }),
      )
      .overrideProvider(BancoOrganizacao)
      .useValue(banco)
      .compile();
    aplicacao = modulo.createNestApplication({ logger: false });
    configurarAplicacao(aplicacao);
    await aplicacao.init();
  });

  afterAll(async () => {
    await aplicacao.close();
  });

  beforeEach(() => {
    consultas.length = 0;
  });

  it('aceita resposta sem sessão e envia apenas hash e respostas ao banco', async () => {
    const codigo = 'a'.repeat(64);
    await request(aplicacao.getHttpServer())
      .post('/api/v1/questionarios/respostas')
      .send({ codigo, sobrecargaPercebida: 1, ritmoPercebido: 2 })
      .expect(202)
      .expect({ recebida: true });
    expect(consultas).toHaveLength(1);
    expect(consultas[0]?.parametros).toEqual([
      createHash('sha256').update(codigo).digest('hex'),
      1,
      2,
    ]);
    expect(JSON.stringify(consultas)).not.toContain(codigo);
  });

  it('rejeita campo nominal e não envia nada ao banco', async () => {
    await request(aplicacao.getHttpServer())
      .post('/api/v1/questionarios/respostas')
      .send({
        codigo: 'b'.repeat(64),
        sobrecargaPercebida: 1,
        ritmoPercebido: 2,
        nome: 'Pessoa Fictícia',
      })
      .expect(400);
    expect(consultas).toHaveLength(0);
  });
});
