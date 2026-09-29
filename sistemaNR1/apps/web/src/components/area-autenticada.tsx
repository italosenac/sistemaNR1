'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useSessao } from './sessao-provider';
import { FormularioAuth } from './formulario-auth';
import { MensagemDeErro } from './mensagem-de-erro';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { consultarApi } from '@/lib/usuarios';
import { esquemaPerfil } from '@/lib/esquemas-c0';
export function AreaAutenticada({ children }: { children: React.ReactNode }) {
  const sessao = useSessao();
  const caminho = usePathname();
  const [erro, definirErro] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  async function reconciliar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    definirOcupado(true);
    definirErro('');
    try {
      const nomeCompleto = String(
        new FormData(e.currentTarget).get('nomeCompleto'),
      ).trim();
      await consultarApi(
        '/meu-perfil/reconciliacao',
        await sessao.obterToken(),
        esquemaPerfil,
        { corpo: { nomeCompleto } },
      );
      await sessao.atualizar();
    } catch (e) {
      definirErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível recuperar o cadastro.',
      );
    } finally {
      definirOcupado(false);
    }
  }
  if (sessao.cliente === undefined)
    return <p role="status">Preparando autenticação...</p>;
  if (!sessao.cliente)
    return (
      <MensagemDeErro mensagem="A autenticação ainda não está configurada neste ambiente." />
    );
  if (sessao.sessao === undefined || sessao.carregando)
    return <p role="status">Carregando sua conta...</p>;
  if (!sessao.sessao) return <FormularioAuth />;
  if (sessao.erro)
    return (
      <div className="space-y-4">
        <MensagemDeErro mensagem={sessao.erro} />
        <Button onClick={() => void sessao.atualizar()}>
          Tentar novamente
        </Button>
        <Button variant="outline" onClick={() => void sessao.sair()}>
          Sair
        </Button>
      </div>
    );
  if (!sessao.perfil || sessao.perfil.status === 'pendente')
    return (
      <form onSubmit={reconciliar} className="space-y-4">
        <h2 className="text-xl font-semibold">Concluir cadastro parcial</h2>
        <p>
          Confirme seu nome para recuperar o perfil. Isso não concede acesso a
          empresas existentes.
        </p>
        <Label htmlFor="reconciliar-nome">Nome completo</Label>
        <Input
          id="reconciliar-nome"
          name="nomeCompleto"
          required
          minLength={3}
          maxLength={150}
        />
        <Button type="submit" disabled={ocupado}>
          Recuperar cadastro
        </Button>
        {erro && <MensagemDeErro mensagem={erro} />}
        <Button variant="outline" onClick={() => void sessao.sair()}>
          Sair
        </Button>
      </form>
    );
  const capacidades = sessao.empresa?.capacidades ?? [];
  const podeOperar =
    sessao.empresa &&
    (sessao.empresa.papeis.includes('gestor_sst_rh') ||
      sessao.empresa.papeis.includes('responsavel_tecnico'));
  const itens = [
    {
      href: '/dashboard',
      rotulo: 'Dashboard',
      icone: LayoutDashboard,
      visivel: true,
    },
    { href: '/empresas', rotulo: 'Empresas', icone: Building2, visivel: true },
    {
      href: '/campanhas',
      rotulo: 'Campanhas M1',
      icone: ClipboardList,
      visivel: Boolean(podeOperar),
    },
    {
      href: '/avaliacoes',
      rotulo: 'Avaliações M2',
      icone: ChartNoAxesCombined,
      visivel: Boolean(podeOperar),
    },
    {
      href: '/inventarios',
      rotulo: 'Inventário M3',
      icone: FileText,
      visivel: Boolean(podeOperar),
    },
  ].filter((item) => item.visivel);
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-2xl bg-[var(--sidebar)] p-3 text-[var(--sidebar-foreground)] lg:sticky lg:top-5 lg:self-start lg:p-4">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
          Área de trabalho
        </p>
        <nav
          aria-label="Jornada principal"
          className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
        >
          {itens.map(({ href, rotulo, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              aria-current={caminho === href ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--sidebar-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${caminho === href ? 'bg-[var(--sidebar-primary)] text-white' : 'text-slate-200'}`}
            >
              <Icone aria-hidden="true" className="size-4" />
              {rotulo}
            </Link>
          ))}
        </nav>
        <div className="mt-4 hidden border-t border-[var(--sidebar-border)] pt-4 text-xs text-slate-300 lg:block">
          Demonstração acadêmica · dados fictícios
        </div>
      </aside>
      <div className="min-w-0 space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-[220px] flex-1">
            {sessao.empresas.length > 0 ? (
              <>
                <Label
                  htmlFor="empresa"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Empresa ativa
                </Label>
                <select
                  id="empresa"
                  value={sessao.empresa?.id ?? ''}
                  onChange={(e) => sessao.selecionarEmpresa(e.target.value)}
                  className="h-11 w-full max-w-md rounded-[10px] border border-input bg-card px-3 text-sm font-medium focus-visible:border-primary"
                >
                  {sessao.empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma empresa vinculada.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/meu-perfil"
              aria-label="Meu perfil"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted"
            >
              <UserRound aria-hidden="true" className="size-4" />
              <span className="max-w-36 truncate">
                {sessao.perfil.nomeCompleto}
              </span>
            </Link>
            <Button variant="outline" onClick={() => void sessao.sair()}>
              <LogOut aria-hidden="true" className="size-4" />
              Sair
            </Button>
          </div>
        </header>
        {sessao.aviso && (
          <p
            role="status"
            className="rounded-lg bg-[var(--color-bg-success)] p-3 text-sm text-[var(--color-text-success)]"
          >
            {sessao.aviso}
          </p>
        )}
        <section key={sessao.empresa?.id ?? 'sem-empresa'} className="min-w-0">
          {children}
        </section>
        <nav
          aria-label="Outras opções"
          className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground"
        >
          <Link href="/meus-vinculos" className="hover:underline">
            Meus vínculos
          </Link>
          <Link href="/empresas/nova" className="hover:underline">
            Nova empresa
          </Link>
          {capacidades.includes('estrutura:ler') && (
            <Link href="/estabelecimentos" className="hover:underline">
              Estrutura
            </Link>
          )}
          {capacidades.includes('usuarios:gerenciar') && (
            <Link href="/usuarios" className="hover:underline">
              Usuários
            </Link>
          )}
          {sessao.empresas.some((e) => e.papeis.includes('consultoria')) && (
            <Link href="/consultoria" className="hover:underline">
              Consultoria
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
