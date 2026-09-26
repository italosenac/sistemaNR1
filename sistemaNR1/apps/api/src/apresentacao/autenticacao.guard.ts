import { Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Identidades } from '../aplicacao/portas-usuarios.js';
import { ErroDeUsuario } from '../dominio/usuario.js';

export interface RequisicaoAutenticada extends Request {
  usuarioAutenticadoId: string;
}

@Injectable()
export class AutenticacaoGuard implements CanActivate {
  constructor(@Inject(Identidades) private readonly identidades: Identidades) {}
  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const requisicao = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();
    const autorizacao = requisicao.headers.authorization;
    const resultado = autorizacao?.match(/^Bearer ([^\s]+)$/);
    if (!resultado || resultado[1].length > 16_384)
      throw new ErroDeUsuario(
        'NAO_AUTENTICADO',
        'Entre com sua conta para continuar.',
      );
    requisicao.usuarioAutenticadoId = await this.identidades.autenticar(
      resultado[1],
    );
    return true;
  }
}
