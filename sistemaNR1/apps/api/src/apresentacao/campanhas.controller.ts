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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ServicoColeta } from '../aplicacao/servico-coleta.js';
import { AutenticacaoGuard } from './autenticacao.guard.js';
import type { RequisicaoAutenticada } from './autenticacao.guard.js';
import {
  AdicionarGrupoDto,
  CriarCampanhaDto,
  EmitirCodigoDto,
  PublicarCampanhaDto,
} from './coleta.dto.js';

@ApiTags('M1 — campanhas demonstrativas')
@ApiBearerAuth()
@UseGuards(AutenticacaoGuard)
@Controller('empresas/:empresaId/campanhas')
export class CampanhasController {
  constructor(@Inject(ServicoColeta) private readonly servico: ServicoColeta) {}

  @Get()
  listar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
  ) {
    return this.servico.listar(r.usuarioAutenticadoId, empresa);
  }

  @Post()
  @ApiBody({ type: CriarCampanhaDto })
  criar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Body() dados: CriarCampanhaDto,
  ) {
    return this.servico.criar(r.usuarioAutenticadoId, empresa, dados);
  }

  @Post(':campanhaId/grupos')
  @ApiBody({ type: AdicionarGrupoDto })
  adicionarGrupo(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('campanhaId', ParseUUIDPipe) campanha: string,
    @Body() dados: AdicionarGrupoDto,
  ) {
    return this.servico.adicionarGrupo(
      r.usuarioAutenticadoId,
      empresa,
      campanha,
      dados,
    );
  }

  @Post(':campanhaId/publicacao')
  @ApiBody({ type: PublicarCampanhaDto })
  publicar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('campanhaId', ParseUUIDPipe) campanha: string,
    @Body() dados: PublicarCampanhaDto,
  ) {
    return this.servico.publicar(
      r.usuarioAutenticadoId,
      empresa,
      campanha,
      dados.estruturaCongeladaId,
    );
  }

  @Post(':campanhaId/codigos')
  @ApiBody({ type: EmitirCodigoDto })
  @Header('Cache-Control', 'no-store')
  emitirCodigo(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('campanhaId', ParseUUIDPipe) campanha: string,
    @Body() dados: EmitirCodigoDto,
  ) {
    return this.servico.emitirCodigo(
      r.usuarioAutenticadoId,
      empresa,
      campanha,
      dados.grupoId,
    );
  }

  @Post(':campanhaId/encerramento')
  encerrar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('campanhaId', ParseUUIDPipe) campanha: string,
  ) {
    return this.servico.encerrar(r.usuarioAutenticadoId, empresa, campanha);
  }

  @Get(':campanhaId/agregados')
  @Header('Cache-Control', 'no-store')
  agregado(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('campanhaId', ParseUUIDPipe) campanha: string,
  ) {
    return this.servico.agregado(r.usuarioAutenticadoId, empresa, campanha);
  }
}
