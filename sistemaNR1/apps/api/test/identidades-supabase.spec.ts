import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { IdentidadesSupabase } from '../src/infraestrutura/identidades-supabase.js';

const usuarioId = '10000000-0000-4000-8000-000000000001';
const tokenFicticio =
  'cabecalho.' +
  Buffer.from(
    JSON.stringify({
      sub: usuarioId,
      aud: 'authenticated',
      iss: 'https://projeto-ficticio.example.invalid/auth/v1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url') +
  '.assinatura-ficticia';
const configuracao = new ConfigService({
  SUPABASE_URL: 'https://projeto-ficticio.example.invalid',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ficticia',
  SUPABASE_SECRET_KEY: 'sb_secret_ficticia_sem_validade',
});

describe('Adaptador Auth — HTTP substituído, sem usuários remotos', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('valida sessão no Auth com chave pública e usa somente o identificador verificado', async () => {
    const chamada = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: usuarioId,
          aud: 'authenticated',
          email: 'pessoa@example.invalid',
          user_metadata: { papel: 'gestor', empresaId: 'nao-confiavel' },
          app_metadata: {},
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const adaptador = new IdentidadesSupabase(configuracao);
    expect(await adaptador.autenticar(tokenFicticio)).toBe(usuarioId);
    const cabecalhos = new Headers(chamada.mock.calls[0][1]?.headers);
    expect(cabecalhos.get('apikey')).toBe('sb_publishable_ficticia');
    expect(cabecalhos.get('Authorization')).toBe('Bearer ' + tokenFicticio);
  });

  it('não reproduz erro interno do provedor ao recusar token', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          msg: 'CONTEUDO_INTERNO_FICTICIO',
          error_code: 'bad_jwt',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    await expect(
      new IdentidadesSupabase(configuracao).autenticar('token-invalido'),
    ).rejects.toMatchObject({
      codigo: 'NAO_AUTENTICADO',
      message: 'Sessão inválida ou expirada. Entre novamente.',
    });
  });

  it('encaminha senha ao Auth sem matrícula, papel ou confirmação artificial do e-mail', async () => {
    const chamada = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: usuarioId,
          aud: 'authenticated',
          email: 'pessoa@example.invalid',
          user_metadata: { nome_completo: 'Pessoa Fictícia' },
          app_metadata: {},
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const adaptador = new IdentidadesSupabase(configuracao);
    expect(
      await adaptador.criarUsuario({
        nomeCompleto: 'Pessoa Fictícia',
        email: 'pessoa@example.invalid',
        senha: 'Senha-Ficticia-2026',
      }),
    ).toBe(usuarioId);
    const opcoes = chamada.mock.calls[0][1];
    const corpo = JSON.parse(String(opcoes?.body));
    expect(corpo).toMatchObject({
      password: 'Senha-Ficticia-2026',
      email_confirm: false,
      user_metadata: { nome_completo: 'Pessoa Fictícia' },
    });
    expect(corpo).not.toHaveProperty('matriculaFuncional');
    expect(corpo.user_metadata).not.toHaveProperty('papel');
    expect(new Headers(opcoes?.headers).get('apikey')).toBe(
      'sb_secret_ficticia_sem_validade',
    );
  });

  it('configuração ausente falha de forma explícita sem tentar a rede', async () => {
    const chamada = jest.spyOn(globalThis, 'fetch');
    await expect(
      new IdentidadesSupabase(new ConfigService({})).autenticar('ficticio'),
    ).rejects.toHaveProperty('codigo', 'SERVICO_INDISPONIVEL');
    expect(chamada).not.toHaveBeenCalled();
  });
});
