'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import type { EmpresaPermitida, PerfilUsuario } from '@sistemanr1/contratos';
import { criarClientePublico } from '@/lib/supabase-publico';
import { consultarApi, esquemaEmpresas } from '@/lib/usuarios';
import { esquemaPerfil } from '@/lib/esquemas-c0';
type ContextoSessao = {
  cliente: ReturnType<typeof criarClientePublico>;
  sessao: Session | null | undefined;
  perfil: PerfilUsuario | null;
  empresas: EmpresaPermitida[];
  empresa: EmpresaPermitida | undefined;
  carregando: boolean;
  erro: string;
  aviso: string;
  informar: (mensagem: string) => void;
  selecionarEmpresa: (id: string) => void;
  atualizar: () => Promise<void>;
  obterToken: () => Promise<string>;
  sair: () => Promise<void>;
};
const Contexto = createContext<ContextoSessao | null>(null);
export function SessaoProvider({ children }: { children: React.ReactNode }) {
  const cliente = useMemo(() => criarClientePublico(), []);
  const [sessao, definirSessao] = useState<Session | null | undefined>(
    undefined,
  );
  const [perfil, definirPerfil] = useState<PerfilUsuario | null>(null);
  const [empresas, definirEmpresas] = useState<EmpresaPermitida[]>([]);
  const [empresaId, definirEmpresaId] = useState('');
  const [erro, definirErro] = useState('');
  const [aviso, informar] = useState('');
  const usuarioCarregado = useRef<string | undefined>(undefined);
  const [carregando, definirCarregando] = useState(false);
  const [revisao, definirRevisao] = useState(0);
  const obterToken = useCallback(async () => {
    const { data, error } = await cliente!.auth.getSession();
    if (error || !data.session)
      throw new Error('Sua sessão expirou. Entre novamente.');
    return data.session.access_token;
  }, [cliente]);
  useEffect(() => {
    if (!cliente) return;
    const { data } = cliente.auth.onAuthStateChange((_evento, nova) => {
      definirSessao(nova);
    });
    return () => data.subscription.unsubscribe();
  }, [cliente]);
  useEffect(() => {
    const cancelamento = new AbortController();
    async function carregar() {
      const mudouUsuario = usuarioCarregado.current !== sessao?.user.id;
      if (mudouUsuario || !sessao) {
        definirPerfil(null);
        definirEmpresas([]);
        informar('');
      }
      definirErro('');
      if (!sessao) {
        definirEmpresaId('');
        definirCarregando(false);
        return;
      }
      if (mudouUsuario) definirCarregando(true);
      try {
        const token = await obterToken();
        const recebida = await consultarApi(
          '/meu-perfil',
          token,
          esquemaPerfil.nullable(),
          { sinal: cancelamento.signal },
        );
        if (cancelamento.signal.aborted) return;
        definirPerfil(recebida);
        usuarioCarregado.current = sessao.user.id;
        if (recebida?.status === 'ativo') {
          const lista = await consultarApi(
            '/minhas-empresas',
            token,
            esquemaEmpresas,
            { sinal: cancelamento.signal },
          );
          if (cancelamento.signal.aborted) return;
          definirEmpresas(lista);
          definirEmpresaId((anterior) =>
            lista.some((e) => e.id === anterior)
              ? anterior
              : (lista[0]?.id ?? ''),
          );
        }
      } catch (e) {
        if (!cancelamento.signal.aborted)
          definirErro(
            e instanceof Error
              ? e.message
              : 'Não foi possível carregar a conta.',
          );
      } finally {
        if (!cancelamento.signal.aborted) definirCarregando(false);
      }
    }
    void carregar();
    return () => cancelamento.abort();
  }, [sessao, obterToken, revisao]);
  const atualizar = useCallback(async () => {
    definirRevisao((r) => r + 1);
  }, []);
  async function sair() {
    const resultado = await cliente?.auth.signOut({ scope: 'local' });
    if (resultado?.error) {
      definirErro('Não foi possível encerrar a sessão. Tente novamente.');
      return;
    }
    definirSessao(null);
    definirPerfil(null);
    definirEmpresas([]);
    definirEmpresaId('');
    definirErro('');
    informar('');
    usuarioCarregado.current = undefined;
  }
  const empresa = empresas.find((e) => e.id === empresaId);
  return (
    <Contexto.Provider
      value={{
        cliente,
        sessao,
        perfil,
        empresas,
        empresa,
        carregando,
        erro,
        aviso,
        informar,
        obterToken,
        atualizar,
        sair,
        selecionarEmpresa: (id) =>
          definirEmpresaId(empresas.some((e) => e.id === id) ? id : ''),
      }}
    >
      {children}
    </Contexto.Provider>
  );
}
export function useSessao() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('Contexto de sessão ausente.');
  return contexto;
}
