import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { RespostaDeSaude } from '@sistemanr1/contratos';

@ApiTags('Saúde')
@Controller('health')
export class SaudeController {
  @Get()
  @ApiOkResponse({
    description: 'API disponível. Não verifica conexão com banco de dados.',
    schema: {
      type: 'object',
      required: ['status', 'servico'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        servico: { type: 'string', enum: ['sistemaNR1-api'] },
      },
    },
  })
  obterSaude(): RespostaDeSaude {
    return { status: 'ok', servico: 'sistemaNR1-api' };
  }
}
