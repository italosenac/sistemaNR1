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
import { RepositorioUsuarios } from '../aplicacao/portas-usuarios.js';
import { ServicoUsuarios } from '../aplicacao/servico-usuarios.js';
import { AutenticacaoGuard } from './autenticacao.guard.js';
import type { RequisicaoAutenticada } from './autenticacao.guard.js';
import { CadastroUsuarioDto, VincularUsuarioDto } from './usuarios.dto.js';

@ApiTags('Usuários — Camada 0')
@ApiBearerAuth()
@UseGuards(AutenticacaoGuard)
@Controller()
export class UsuariosController {
  constructor(
    @Inject(ServicoUsuarios) private readonly servico: ServicoUsuarios,
    @Inject(RepositorioUsuarios)
    private readonly repositorio: RepositorioUsuarios,
  ) {}

  @Get('minhas-empresas')
  @Header('Cache-Control', 'no-store')
  listarEmpresas(@Req() requisicao: RequisicaoAutenticada) {
    return this.repositorio.listarEmpresas(requisicao.usuarioAutenticadoId);
  }

  @Get('empresas/:empresaId/usuarios')
  @Header('Cache-Control', 'no-store')
  listar(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
  ) {
    return this.repositorio.listarUsuarios(
      requisicao.usuarioAutenticadoId,
      empresaId,
    );
  }

  @Get('empresas/:empresaId/usuarios/opcoes')
  @Header('Cache-Control', 'no-store')
  opcoes(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
  ) {
    return this.repositorio.obterOpcoes(
      requisicao.usuarioAutenticadoId,
      empresaId,
    );
  }

  @Post('empresas/:empresaId/usuarios')
  @ApiBody({ type: CadastroUsuarioDto })
  @Header('Cache-Control', 'no-store')
  cadastrar(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() entrada: CadastroUsuarioDto,
  ) {
    return this.servico.cadastrar(
      requisicao.usuarioAutenticadoId,
      empresaId,
      entrada,
    );
  }

  @Post('empresas/:empresaId/vinculos')
  @ApiBody({ type: VincularUsuarioDto })
  @Header('Cache-Control', 'no-store')
  vincular(
    @Req() requisicao: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() entrada: VincularUsuarioDto,
  ) {
    return this.servico.vincularExistente(
      requisicao.usuarioAutenticadoId,
      empresaId,
      entrada,
    );
  }
}
