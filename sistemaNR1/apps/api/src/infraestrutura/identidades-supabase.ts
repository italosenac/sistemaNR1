import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CadastroUsuario } from '@sistemanr1/contratos';
import { Identidades } from '../aplicacao/portas-usuarios.js';
import { ErroDeUsuario } from '../dominio/usuario.js';

// Complementa a verificação criptográfica/remota de getUser; nunca autoriza
// pela simples decodificação de um JWT ou por seus metadados editáveis.
function contextoDoTokenValido(
  token: string,
  usuarioId: string,
  url: string,
): boolean {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return false;
    const claims: Record<string, unknown> = JSON.parse(
      Buffer.from(partes[1], 'base64url').toString('utf8'),
    );
    const agora = Math.floor(Date.now() / 1000);
    return (
      claims.sub === usuarioId &&
      claims.aud === 'authenticated' &&
      claims.iss === url.replace(/\/$/, '') + '/auth/v1' &&
      typeof claims.exp === 'number' &&
      claims.exp > agora &&
      (claims.nbf === undefined ||
        (typeof claims.nbf === 'number' && claims.nbf <= agora))
    );
  } catch {
    return false;
  }
}

@Injectable()
export class IdentidadesSupabase extends Identidades {
  constructor(
    @Inject(ConfigService) private readonly configuracao: ConfigService,
  ) {
    super();
  }

  private cliente(privilegiado: boolean): SupabaseClient {
    const url = this.configuracao.get<string>('SUPABASE_URL');
    const chave = this.configuracao.get<string>(
      privilegiado ? 'SUPABASE_SECRET_KEY' : 'SUPABASE_PUBLISHABLE_KEY',
    );
    if (!url || !chave)
      throw new ErroDeUsuario(
        'SERVICO_INDISPONIVEL',
        'Serviço de identidade ainda não configurado.',
      );
    return createClient(url, chave, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (entrada, opcoes) =>
          fetch(entrada, { ...opcoes, signal: AbortSignal.timeout(10_000) }),
      },
    });
  }

  async autenticar(token: string): Promise<string> {
    try {
      const { data, error } = await this.cliente(false).auth.getUser(token);
      if (
        error ||
        !data.user ||
        data.user.aud !== 'authenticated' ||
        !contextoDoTokenValido(
          token,
          data.user.id,
          this.configuracao.get<string>('SUPABASE_URL')!,
        )
      )
        throw new ErroDeUsuario(
          'NAO_AUTENTICADO',
          'Sessão inválida ou expirada. Entre novamente.',
        );
      return data.user.id;
    } catch (erro) {
      if (erro instanceof ErroDeUsuario) throw erro;
      throw new ErroDeUsuario(
        'SERVICO_INDISPONIVEL',
        'Não foi possível verificar a sessão.',
      );
    }
  }

  async criarUsuario(
    entrada: Pick<CadastroUsuario, 'nomeCompleto' | 'email' | 'senha'>,
  ): Promise<string> {
    try {
      const { data, error } = await this.cliente(true).auth.admin.createUser({
        email: entrada.email,
        password: entrada.senha,
        email_confirm: false,
        user_metadata: { nome_completo: entrada.nomeCompleto },
      });
      if (error || !data.user)
        throw new ErroDeUsuario(
          'IDENTIDADE_RECUSADA',
          'Não foi possível criar a conta. Confira os dados ou vincule uma conta já existente.',
        );
      return data.user.id;
    } catch (erro) {
      if (erro instanceof ErroDeUsuario) throw erro;
      throw new ErroDeUsuario(
        'SERVICO_INDISPONIVEL',
        'Serviço de identidade indisponível.',
      );
    }
  }
}
