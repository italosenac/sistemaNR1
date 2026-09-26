import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configurarAplicacao } from './infraestrutura/configurar-aplicacao.js';

async function iniciarAplicacao(): Promise<void> {
  const aplicacao = await NestFactory.create(AppModule);
  configurarAplicacao(aplicacao);
  aplicacao.enableShutdownHooks();
  const porta = aplicacao.get(ConfigService).getOrThrow<number>('PORT');
  await aplicacao.listen(porta, '0.0.0.0');
  Logger.log(`API disponível na porta ${porta}.`, 'Inicializacao');
}

void iniciarAplicacao().catch(() => {
  Logger.error(
    'Não foi possível iniciar a API. Verifique configuração e disponibilidade da porta.',
    'Inicializacao',
  );
  process.exitCode = 1;
});
