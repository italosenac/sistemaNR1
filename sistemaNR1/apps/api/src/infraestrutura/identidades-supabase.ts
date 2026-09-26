import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CadastroUsuario } from '@sistemanr1/contratos';
import { Identidades } from '../aplicacao/portas-usuarios.js';
import { ErroDeUsuario } from '../dominio/usuario.js';

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
      if (error || !data.user || data.user.aud !== 'authenticated')
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
