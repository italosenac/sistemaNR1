import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ServicoInventario } from '../aplicacao/servico-inventario.js';
import { AutenticacaoGuard } from './autenticacao.guard.js';
import type { RequisicaoAutenticada } from './autenticacao.guard.js';
import { ConsolidarInventarioDto } from './inventario.dto.js';

@ApiTags('M3 — inventário geral demonstrativo')
@ApiBearerAuth()
@UseGuards(AutenticacaoGuard)
@Controller('empresas/:empresaId/inventarios')
export class InventarioController {
  constructor(
    @Inject(ServicoInventario) private readonly servico: ServicoInventario,
  ) {}

  @Get()
  listar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
  ) {
    return this.servico.listar(r.usuarioAutenticadoId, empresa);
  }

  @Post('consolidacoes')
  @ApiBody({ type: ConsolidarInventarioDto })
  consolidar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Body() dados: ConsolidarInventarioDto,
  ) {
    return this.servico.consolidar(r.usuarioAutenticadoId, empresa, dados);
  }

  @Get(':versaoId')
  obter(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('versaoId', ParseUUIDPipe) versao: string,
  ) {
    return this.servico.obter(r.usuarioAutenticadoId, empresa, versao);
  }

  @Get(':versaoId/pdf')
  @Header('Cache-Control', 'private, no-store')
  async pdf(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('versaoId', ParseUUIDPipe) versao: string,
  ) {
    const arquivo = await this.servico.pdf(
      r.usuarioAutenticadoId,
      empresa,
      versao,
    );
    return new StreamableFile(arquivo, {
      type: 'application/pdf',
      disposition: `attachment; filename="inventario-${versao}.pdf"`,
    });
  }
}
