'use client';
import Link from 'next/link';
import { Building2, ShieldCheck, UserRound } from 'lucide-react';
import { useSessao } from './sessao-provider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const estiloLink =
  'text-sm font-medium text-[var(--color-text-brand)] underline-offset-4 hover:underline';

export function PainelC0() {
  const { empresas, empresa } = useSessao();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-brand)]">
          Visão geral
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Seu espaço de trabalho
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {empresa
            ? `Empresa selecionada: ${empresa.nome}. Escolha uma tarefa disponível para este vínculo.`
            : 'Sua conta está pronta. Crie uma empresa ou solicite associação ao gestor.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-secondary text-[var(--color-text-brand)]">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <CardTitle>Contexto empresarial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {empresas.length} empresa(s) autorizada(s).
            </p>
            <Link className={estiloLink} href="/empresas">
              Ver empresas e selecionar contexto
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-secondary text-[var(--color-text-brand)]">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <CardTitle>Minha conta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link className={estiloLink} href="/meu-perfil">
              Atualizar meu perfil
            </Link>
            <Link className={estiloLink} href="/empresas/nova">
              Cadastrar empresa fictícia
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 rounded-xl border border-[var(--color-border-privacy)] bg-[var(--color-bg-privacy)] p-4 text-sm text-[var(--color-text-privacy)]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Ambiente acadêmico: use somente dados fictícios. A jornada M1–M3 ainda
          está em desenvolvimento; resultados de questionários não aparecem
          neste painel.
        </p>
      </div>
    </div>
  );
}
