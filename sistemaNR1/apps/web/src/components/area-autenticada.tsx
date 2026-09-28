'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
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
  return (
    <div className="space-y-6">
      <header className="space-y-4 border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>{sessao.perfil.nomeCompleto}</p>
          <Button variant="outline" onClick={() => void sessao.sair()}>
            Sair
          </Button>
        </div>
        <nav
          aria-label="Navegação da conta"
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-teal-800 underline underline-offset-4"
        >
          <Link href="/dashboard">Painel</Link>
          <Link href="/meu-perfil">Meu perfil</Link>
          <Link href="/empresas">Empresas</Link>
          <Link href="/empresas/nova">Nova empresa</Link>
          <Link href="/meus-vinculos">Meus vínculos</Link>
          {sessao.empresas.some((e) => e.papeis.includes('consultoria')) && (
            <Link href="/consultoria">Carteira da consultoria</Link>
          )}
          {capacidades.includes('empresa:editar') && (
            <Link href="/empresas/editar">Editar empresa</Link>
          )}
          {capacidades.includes('usuarios:gerenciar') && (
            <>
              <Link href="/usuarios">Usuários</Link>
              <Link href="/vinculos">Vínculos e matrículas</Link>
              <Link href="/papeis">Papéis</Link>
              <Link href="/lotacoes">Lotações</Link>
            </>
          )}
          {capacidades.includes('estrutura:ler') && (
            <>
              <Link href="/estabelecimentos">Estabelecimentos</Link>
              <Link href="/setores">Setores</Link>
              <Link href="/funcoes">Funções</Link>
              <Link href="/turnos">Turnos</Link>
              <Link href="/grupos">Grupos</Link>
            </>
          )}
        </nav>
        {sessao.empresas.length > 0 && (
          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <select
              id="empresa"
              value={sessao.empresa?.id ?? ''}
              onChange={(e) => sessao.selecionarEmpresa(e.target.value)}
              className="h-10 w-full rounded-lg border bg-white px-3"
            >
              {sessao.empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>
      {sessao.aviso && (
        <p role="status" className="rounded-lg bg-teal-50 p-3 text-teal-900">
          {sessao.aviso}
        </p>
      )}
      <section key={sessao.empresa?.id ?? 'sem-empresa'}>{children}</section>
    </div>
  );
}
