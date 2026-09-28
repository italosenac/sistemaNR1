'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { z } from 'zod';
import { useSessao } from './sessao-provider';
import { consultarApi } from '@/lib/usuarios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type Resumo = {
  campanhas: number;
  avaliacoes: number;
  inventarios: number;
  ultimaVersao: number | null;
};
const listaCampanhas = z.array(
  z.object({ id: z.uuid(), titulo: z.string(), estado: z.string() }),
);
const listaAvaliacoes = z.array(z.object({ id: z.uuid() }));
const listaInventarios = z.array(
  z.object({ id: z.uuid(), versao: z.number() }),
);
const acoes = [
  {
    href: '/campanhas',
    titulo: 'Criar ou abrir campanha',
    descricao: 'Organize a coleta anônima M1.',
    icone: ClipboardList,
  },
  {
    href: '/avaliacoes',
    titulo: 'Avaliar riscos',
    descricao: 'Use agregados divulgáveis em M2.',
    icone: ChartNoAxesCombined,
  },
  {
    href: '/inventarios',
    titulo: 'Abrir inventário',
    descricao: 'Consolide M3 e baixe o rascunho.',
    icone: FileText,
  },
];

export function PainelC0() {
  const { empresa, obterToken } = useSessao();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!empresa) return;
    let ativo = true;
    const id = empresa.id;
    const timer = window.setTimeout(() => {
      setCarregando(true);
      setErro('');
      void (async () => {
        try {
          const token = await obterToken();
          const base = `/empresas/${id}`;
          const [campanhas, avaliacoes, inventarios] = await Promise.all([
            consultarApi(`${base}/campanhas`, token, listaCampanhas),
            consultarApi(
              `${base}/avaliacoes/resultados`,
              token,
              listaAvaliacoes,
            ),
            consultarApi(`${base}/inventarios`, token, listaInventarios),
          ]);
          if (ativo)
            setResumo({
              campanhas: campanhas.length,
              avaliacoes: avaliacoes.length,
              inventarios: inventarios.length,
              ultimaVersao: inventarios.at(-1)?.versao ?? null,
            });
        } catch (e) {
          if (ativo)
            setErro(e instanceof Error ? e.message : 'Resumo indisponível.');
        } finally {
          if (ativo) setCarregando(false);
        }
      })();
    }, 0);
    return () => {
      ativo = false;
      window.clearTimeout(timer);
    };
  }, [empresa, obterToken]);
  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-brand)]">
          Visão geral
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Seu espaço de trabalho
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {empresa
            ? `Contexto ativo: ${empresa.nome}. Escolha o próximo passo da jornada.`
            : 'Selecione uma empresa vinculada para começar.'}
        </p>
      </div>
      {empresa && (
        <>
          {carregando && (
            <p role="status" className="text-sm text-muted-foreground">
              Carregando dados da empresa...
            </p>
          )}
          {erro && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-red-50 p-4 text-sm text-destructive"
            >
              Não foi possível carregar o resumo: {erro}
            </p>
          )}
          {resumo && !carregando && !erro && (
            <div
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="Dados da empresa"
            >
              {[
                ['Campanhas', resumo.campanhas],
                ['Avaliações', resumo.avaliacoes],
                ['Inventários', resumo.inventarios],
                ['Última versão', resumo.ultimaVersao ?? '—'],
              ].map(([rotulo, valor]) => (
                <Card key={rotulo}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {rotulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tabular-nums">
                      {valor}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {acoes.map(({ href, titulo, descricao, icone: Icone }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-secondary text-[var(--color-text-brand)]">
                  <Icone aria-hidden="true" className="size-5" />
                </span>
                <span className="block font-semibold">{titulo}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {descricao}
                </span>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text-brand)]">
                  Abrir{' '}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
      {!empresa && (
        <Link
          href="/empresas"
          className="inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Ver empresas
        </Link>
      )}
      <div className="flex gap-3 rounded-xl border border-[var(--color-border-privacy)] bg-[var(--color-bg-privacy)] p-4 text-sm text-[var(--color-text-privacy)]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>
          Demonstração acadêmica com dados fictícios comprovados. Resultados M1
          só aparecem quando a proteção de anonimato permite.
        </p>
      </div>
    </div>
  );
}
