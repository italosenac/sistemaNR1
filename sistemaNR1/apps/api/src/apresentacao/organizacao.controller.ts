import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { PipeTransform } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { TIPOS_ESTRUTURA } from '@sistemanr1/contratos';
import type { TipoEstrutura } from '@sistemanr1/contratos';
import { ServicoOrganizacao } from '../aplicacao/servico-organizacao.js';
import { RepositorioOrganizacao } from '../aplicacao/portas-organizacao.js';
import { AutenticacaoGuard } from './autenticacao.guard.js';
import type { RequisicaoAutenticada } from './autenticacao.guard.js';
import {
  CongelarDto,
  EditarEmpresaDto,
  EditarVinculoDto,
  EmpresaDto,
  EstruturaDto,
  MotivoDto,
  PapelDto,
  PerfilDto,
  ProfissionalDto,
  SalvarLotacaoDto,
} from './organizacao.dto.js';
class TipoEstruturaPipe implements PipeTransform<string, TipoEstrutura> {
  transform(valor: string): TipoEstrutura {
    const tipo = TIPOS_ESTRUTURA.find((t) => t === valor);
    if (!tipo) throw new BadRequestException('Tipo de estrutura inválido.');
    return tipo;
  }
}
@ApiTags('Organizações — Camada 0')
@ApiBearerAuth()
@UseGuards(AutenticacaoGuard)
@Controller()
export class OrganizacaoController {
  constructor(
    @Inject(ServicoOrganizacao) private readonly servico: ServicoOrganizacao,
    @Inject(RepositorioOrganizacao)
    private readonly repositorio: RepositorioOrganizacao,
  ) {}
  @Get('meu-perfil')
  @Header('Cache-Control', 'no-store')
  async perfil(@Req() r: RequisicaoAutenticada, @Res() resposta: Response) {
    resposta.setHeader('Cache-Control', 'no-store');
    resposta.json(await this.repositorio.perfil(r.usuarioAutenticadoId));
  }
  @Patch('meu-perfil')
  @ApiBody({ type: PerfilDto })
  atualizarPerfil(@Req() r: RequisicaoAutenticada, @Body() dados: PerfilDto) {
    return this.repositorio.atualizarPerfil(
      r.usuarioAutenticadoId,
      dados.nomeCompleto,
      false,
    );
  }
  @Post('meu-perfil/reconciliacao')
  @ApiBody({ type: PerfilDto })
  reconciliar(@Req() r: RequisicaoAutenticada, @Body() dados: PerfilDto) {
    return this.repositorio.atualizarPerfil(
      r.usuarioAutenticadoId,
      dados.nomeCompleto,
      true,
    );
  }
  @Get('meu-perfil/registros-profissionais')
  @Header('Cache-Control', 'no-store')
  profissionais(@Req() r: RequisicaoAutenticada) {
    return this.repositorio.profissionais(r.usuarioAutenticadoId);
  }
  @Post('meu-perfil/registros-profissionais')
  @ApiBody({ type: ProfissionalDto })
  criarProfissional(
    @Req() r: RequisicaoAutenticada,
    @Body() dados: ProfissionalDto,
  ) {
    return this.repositorio.salvarProfissional(r.usuarioAutenticadoId, dados);
  }
  @Patch('meu-perfil/registros-profissionais/:id')
  @ApiBody({ type: ProfissionalDto })
  editarProfissional(
    @Req() r: RequisicaoAutenticada,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: ProfissionalDto,
  ) {
    return this.repositorio.salvarProfissional(
      r.usuarioAutenticadoId,
      dados,
      id,
    );
  }
  @Get('meus-vinculos')
  @Header('Cache-Control', 'no-store')
  meusVinculos(@Req() r: RequisicaoAutenticada) {
    return this.repositorio.meusVinculos(r.usuarioAutenticadoId);
  }
  @Post('empresas')
  @ApiBody({ type: EmpresaDto })
  criarEmpresa(@Req() r: RequisicaoAutenticada, @Body() dados: EmpresaDto) {
    return this.servico.criarEmpresa(r.usuarioAutenticadoId, dados);
  }
  @Get('empresas/:empresaId')
  @Header('Cache-Control', 'no-store')
  empresa(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
  ) {
    return this.repositorio.empresa(r.usuarioAutenticadoId, empresa);
  }
  @Patch('empresas/:empresaId')
  @ApiBody({ type: EditarEmpresaDto })
  editarEmpresa(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Body() dados: EditarEmpresaDto,
  ) {
    return this.servico.editarEmpresa(r.usuarioAutenticadoId, empresa, dados);
  }
  @Get('empresas/:empresaId/estrutura/:tipo')
  @Header('Cache-Control', 'no-store')
  estrutura(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('tipo', TipoEstruturaPipe) tipo: TipoEstrutura,
  ) {
    return this.repositorio.estrutura(r.usuarioAutenticadoId, empresa, tipo);
  }
  @Post('empresas/:empresaId/estrutura/:tipo')
  @ApiBody({ type: EstruturaDto })
  criarEstrutura(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('tipo', TipoEstruturaPipe) tipo: TipoEstrutura,
    @Body() dados: EstruturaDto,
  ) {
    return this.servico.salvarEstrutura(
      r.usuarioAutenticadoId,
      empresa,
      tipo,
      dados,
    );
  }
  @Patch('empresas/:empresaId/estrutura/:tipo/:id')
  @ApiBody({ type: EstruturaDto })
  editarEstrutura(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('tipo', TipoEstruturaPipe) tipo: TipoEstrutura,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: EstruturaDto,
  ) {
    return this.servico.salvarEstrutura(
      r.usuarioAutenticadoId,
      empresa,
      tipo,
      dados,
      id,
    );
  }
  @Patch('empresas/:empresaId/vinculos/:id')
  @ApiBody({ type: EditarVinculoDto })
  editarVinculo(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: EditarVinculoDto,
  ) {
    return this.repositorio.editarVinculo(
      r.usuarioAutenticadoId,
      empresa,
      id,
      dados.matriculaFuncional ?? null,
      dados.status,
    );
  }
  @Post('empresas/:empresaId/vinculos/:id/lotacao')
  @ApiBody({ type: SalvarLotacaoDto })
  salvarLotacao(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: SalvarLotacaoDto,
  ) {
    return this.repositorio.salvarLotacao(
      r.usuarioAutenticadoId,
      empresa,
      id,
      dados,
    );
  }
  @Get('empresas/:empresaId/vinculos/:id/papeis')
  @Header('Cache-Control', 'no-store')
  papeis(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.repositorio.atribuicoes(r.usuarioAutenticadoId, empresa, id);
  }
  @Post('empresas/:empresaId/vinculos/:id/papeis')
  @ApiBody({ type: PapelDto })
  conceder(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: PapelDto,
  ) {
    return this.repositorio.concederPapel(
      r.usuarioAutenticadoId,
      empresa,
      id,
      dados.papel,
      dados.motivo,
    );
  }
  @Post('empresas/:empresaId/vinculos/:id/papeis/:atribuicao/revogacao')
  @ApiBody({ type: MotivoDto })
  async revogar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('atribuicao', ParseUUIDPipe) atribuicao: string,
    @Body() dados: MotivoDto,
  ) {
    await this.repositorio.revogarPapel(
      r.usuarioAutenticadoId,
      empresa,
      id,
      atribuicao,
      dados.motivo,
    );
    return { revogado: true };
  }
  @Get('empresas/:empresaId/estruturas-congeladas')
  @Header('Cache-Control', 'no-store')
  snapshots(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
  ) {
    return this.repositorio.snapshots(r.usuarioAutenticadoId, empresa);
  }
  @Post('empresas/:empresaId/estruturas-congeladas')
  @ApiBody({ type: CongelarDto })
  congelar(
    @Req() r: RequisicaoAutenticada,
    @Param('empresaId', ParseUUIDPipe) empresa: string,
    @Body() dados: CongelarDto,
  ) {
    return this.repositorio.congelar(
      r.usuarioAutenticadoId,
      empresa,
      dados.estabelecimentoId,
    );
  }
}
