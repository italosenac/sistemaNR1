import { IsIn, IsInt, IsUrl, Max, Min, validateSync } from 'class-validator';

class ConfiguracaoAmbiente {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3001;

  @IsUrl({
    require_tld: false,
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  FRONTEND_URL = 'http://localhost:3000';
}

export function validarAmbiente(ambiente: Record<string, unknown>) {
  const configuracao = Object.assign(new ConfiguracaoAmbiente(), {
    NODE_ENV: ambiente.NODE_ENV ?? 'development',
    PORT: Number(ambiente.PORT ?? 3001),
    FRONTEND_URL: ambiente.FRONTEND_URL ?? 'http://localhost:3000',
  });
  const erros = validateSync(configuracao);
  if (erros.length > 0) {
    throw new Error(
      `Configuração de ambiente inválida: ${erros.map((erro) => erro.property).join(', ')}.`,
    );
  }
  if (new URL(configuracao.FRONTEND_URL).origin !== configuracao.FRONTEND_URL) {
    throw new Error('FRONTEND_URL deve conter somente a origem, sem caminho.');
  }
  return configuracao;
}
