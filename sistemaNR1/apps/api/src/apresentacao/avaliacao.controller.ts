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
import { ServicoAvaliacao } from '../aplicacao/servico-avaliacao.js';
import { AutenticacaoGuard } from './autenticacao.guard.js';
import type { RequisicaoAutenticada } from './autenticacao.guard.js';
import { PublicarCriterioDto, RegistrarAvaliacaoDto } from './avaliacao.dto.js';

@ApiTags('M2 — avaliação demonstrativa')
@ApiBearerAuth()
@UseGuards(AutenticacaoGuard)
@Controller('empresas/:empresaId/avaliacoes')
export class AvaliacaoController {
  constructor(
    @Inject(ServicoAvaliacao) private readonly servico: ServicoAvaliacao,
  ) {}

  @Get('modelo')
  modelo(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
  ) {
    return this.servico.modelo(r.usuarioAutenticadoId, empresa);
  }

  @Get('criterios')
  criterios(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
  ) {
    return this.servico.listarCriterios(r.usuarioAutenticadoId, empresa);
  }

  @Post('criterios')
  @ApiBody({ type: PublicarCriterioDto })
  publicar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Body() dados: PublicarCriterioDto,
  ) {
    return this.servico.publicarCriterio(
      r.usuarioAutenticadoId,
      empresa,
      dados,
    );
  }

  @Get('criterios/:criterioId/pdf')
  @Header('Cache-Control', 'private, no-store')
  async pdfCriterio(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('criterioId', ParseUUIDPipe) criterio: string,
  ) {
    const arquivo = await this.servico.pdfCriterio(
      r.usuarioAutenticadoId,
      empresa,
      criterio,
    );
    return new StreamableFile(arquivo, {
      type: 'application/pdf',
      disposition: `attachment; filename="criterios-${criterio}.pdf"`,
    });
  }

  @Get('resultados')
  resultados(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
  ) {
    return this.servico.listarResultados(r.usuarioAutenticadoId, empresa);
  }

  @Post('resultados')
  @ApiBody({ type: RegistrarAvaliacaoDto })
  registrar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Body() dados: RegistrarAvaliacaoDto,
  ) {
    return this.servico.registrar(r.usuarioAutenticadoId, empresa, dados);
  }
}
