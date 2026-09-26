import { Body, Controller, Get, Post } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IsString, MinLength } from 'class-validator';
import request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from '../src/app.module';
import { configurarAplicacao } from '../src/infraestrutura/configurar-aplicacao';
import { validarAmbiente } from '../src/infraestrutura/validar-ambiente';

class EntradaDeProva {
  @IsString()
  @MinLength(2)
  nome!: string;
}

@Controller('prova')
class ControladorDeProva {
  @Post()
  receber(@Body() entrada: EntradaDeProva) {
    return { nome: entrada.nome };
  }

  @Get('falha')
  falhar() {
    throw new Error('SEGREDO_DE_TESTE_NAO_PODE_VAZAR');
  }
}

async function criarAplicacaoDeTeste(ambiente: string) {
  const modulo = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [ControladorDeProva],
  })
    .overrideProvider(ConfigService)
    .useValue(
      new ConfigService({
        NODE_ENV: ambiente,
        PORT: 3001,
        FRONTEND_URL: 'http://localhost:3000',
      }),
    )
    .compile();
  const aplicacao = modulo.createNestApplication({ logger: false });
  configurarAplicacao(aplicacao);
  await aplicacao.init();
  return aplicacao;
}

describe('Fundação E0 — aplicação HTTP real', () => {
  let aplicacao: INestApplication<Server>;

  beforeAll(async () => {
    aplicacao = await criarAplicacaoDeTeste('test');
  });

  afterAll(async () => {
    await aplicacao.close();
  });

  it('responde /health com o contrato exato sem depender do Supabase', async () => {
    await request(aplicacao.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', servico: 'sistemaNR1-api' });
  });

  it('aplica /api/v1 às demais rotas e mantém /health fora do prefixo', async () => {
    await request(aplicacao.getHttpServer())
      .post('/api/v1/prova')
      .send({ nome: 'Teste' })
      .expect(201)
      .expect({ nome: 'Teste' });
    await request(aplicacao.getHttpServer()).post('/prova').expect(404);
    await request(aplicacao.getHttpServer()).get('/api/v1/health').expect(404);
  });

  it.each([{ nome: 'x' }, { nome: 'Teste', segredo: 'indevido' }])(
    'rejeita DTO inválido ou propriedade desconhecida: %j',
    async (entrada) => {
      const resposta = await request(aplicacao.getHttpServer())
        .post('/api/v1/prova')
        .send(entrada)
        .expect(400);
      expect(resposta.body).toMatchObject({
        statusCode: 400,
        codigo: 'REQUISICAO_INVALIDA',
        mensagem: expect.any(Array),
        correlationId: expect.any(String),
      });
    },
  );

  it('retorna erro padronizado sem expor exceção inesperada', async () => {
    const resposta = await request(aplicacao.getHttpServer())
      .get('/api/v1/prova/falha')
      .expect(500);
    expect(resposta.body).toMatchObject({
      codigo: 'ERRO_INTERNO',
      mensagem: 'Não foi possível concluir a solicitação.',
      correlationId: expect.any(String),
    });
    expect(resposta.text).not.toContain('SEGREDO_DE_TESTE');
    expect(resposta.body).not.toHaveProperty('stack');
  });

  it('autoriza CORS somente para a origem configurada', async () => {
    await request(aplicacao.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3000')
      .expect('Access-Control-Allow-Origin', 'http://localhost:3000');
    const resposta = await request(aplicacao.getHttpServer())
      .get('/health')
      .set('Origin', 'https://origem-nao-autorizada.example');
    expect(resposta.headers).not.toHaveProperty('access-control-allow-origin');
  });
});

describe('Swagger por ambiente', () => {
  it.each([
    ['development', 200],
    ['production', 404],
  ])('em %s responde documentação com HTTP %i', async (ambiente, status) => {
    const aplicacao = await criarAplicacaoDeTeste(String(ambiente));
    try {
      await request(aplicacao.getHttpServer())
        .get('/api/docs-json')
        .expect(Number(status));
    } finally {
      await aplicacao.close();
    }
  });
});

describe('Configuração do ambiente', () => {
  it('aceita ambiente sem credenciais reais do Supabase', () => {
    expect(validarAmbiente({})).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3001,
      FRONTEND_URL: 'http://localhost:3000',
    });
  });

  it.each([
    { PORT: 'invalida' },
    { PORT: '65536' },
    { FRONTEND_URL: '*' },
    { FRONTEND_URL: 'http://localhost:3000/caminho' },
    { NODE_ENV: 'qualquer' },
  ])('rejeita configuração inválida: %j', (ambiente) => {
    expect(() => validarAmbiente(ambiente)).toThrow();
  });
});
