import { RequestMethod, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FiltroDeErros } from '../apresentacao/filtro-de-erros.js';

export function configurarAplicacao(aplicacao: INestApplication): void {
  const configuracao = aplicacao.get(ConfigService);
  const origemPermitida = configuracao.getOrThrow<string>('FRONTEND_URL');
  aplicacao.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  aplicacao.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    }),
  );
  aplicacao.useGlobalFilters(new FiltroDeErros());
  aplicacao.enableCors({
    origin: (
      origem: string | undefined,
      concluir: (erro: Error | null, permitir: boolean) => void,
    ) => {
      concluir(null, !origem || origem === origemPermitida);
    },
    credentials: false,
  });
  if (configuracao.getOrThrow<string>('NODE_ENV') === 'development') {
    const opcoes = new DocumentBuilder()
      .setTitle('SistemaNR1 — API')
      .setDescription(
        'Camada 0: identidade, empresas, estrutura e autorização. M1–M6 ainda não implementados.',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup(
      'api/docs',
      aplicacao,
      SwaggerModule.createDocument(aplicacao, opcoes),
    );
  }
}
