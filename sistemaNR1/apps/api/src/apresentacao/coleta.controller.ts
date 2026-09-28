import {
  Body,
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { createHash } from 'node:crypto';
import { BancoOrganizacao } from '../infraestrutura/banco-organizacao.js';
import { RespostaAnonimaDto } from './coleta.dto.js';

@ApiTags('M1 — coleta anônima demonstrativa')
@Controller('questionarios')
export class ColetaController {
  constructor(
    @Inject(BancoOrganizacao) private readonly banco: BancoOrganizacao,
  ) {}

  @Post('respostas')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @ApiBody({ type: RespostaAnonimaDto })
  async responder(@Body() dados: RespostaAnonimaDto) {
    const hash = createHash('sha256')
      .update(dados.codigo, 'utf8')
      .digest('hex');
    await this.banco.transacaoAnonima(async (cliente) => {
      await cliente.query(
        'SELECT coleta.registrar_resposta($1,$2::smallint,$3::smallint)',
        [hash, dados.sobrecargaPercebida, dados.ritmoPercebido],
      );
    });
    return { recebida: true };
  }
}
