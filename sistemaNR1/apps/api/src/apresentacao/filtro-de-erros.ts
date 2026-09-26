import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ErroDeUsuario } from '../dominio/usuario.js';

const statusPorErroUsuario = {
  NAO_AUTENTICADO: 401,
  SEM_PERMISSAO: 403,
  LOTACAO_INVALIDA: 400,
  MATRICULA_DUPLICADA: 409,
  VINCULO_DUPLICADO: 409,
  IDENTIDADE_RECUSADA: 409,
  SERVICO_INDISPONIVEL: 503,
  CADASTRO_PARCIAL: 409,
} as const;

function obterMensagem(excecao: unknown): string | string[] {
  if (!(excecao instanceof HttpException)) {
    return 'Não foi possível concluir a solicitação.';
  }
  const resposta = excecao.getResponse();
  if (typeof resposta === 'string') return resposta;
  if ('message' in resposta) {
    if (typeof resposta.message === 'string') return resposta.message;
    if (
      Array.isArray(resposta.message) &&
      resposta.message.every(
        (mensagem: unknown) => typeof mensagem === 'string',
      )
    ) {
      return resposta.message as string[];
    }
  }
  return 'Solicitação não atendida.';
}

@Catch()
export class FiltroDeErros implements ExceptionFilter {
  catch(excecao: unknown, contexto: ArgumentsHost): void {
    const resposta = contexto.switchToHttp().getResponse<Response>();
    if (excecao instanceof ErroDeUsuario) {
      const statusCode = statusPorErroUsuario[excecao.codigo];
      resposta.status(statusCode).json({
        statusCode,
        codigo: excecao.codigo,
        mensagem: excecao.message,
        correlationId: randomUUID(),
        ...(excecao.usuarioIdCriado
          ? { usuarioIdCriado: excecao.usuarioIdCriado }
          : {}),
      });
      return;
    }
    const statusCode =
      excecao instanceof HttpException
        ? excecao.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const codigo =
      statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'ERRO_INTERNO'
        : statusCode === HttpStatus.BAD_REQUEST
          ? 'REQUISICAO_INVALIDA'
          : 'SOLICITACAO_NAO_ATENDIDA';
    resposta.status(statusCode).json({
      statusCode,
      codigo,
      mensagem:
        statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Não foi possível concluir a solicitação.'
          : obterMensagem(excecao),
      correlationId: randomUUID(),
    });
  }
}
