import Link from 'next/link';
import { ClipboardList, FileStack, ScanLine, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EstadoDaApi } from '@/components/estado-da-api';

const modulos = [
  {
    codigo: 'M1',
    titulo: 'Coleta',
    descricao: 'Um ponto de partida para ouvir e compreender o trabalho.',
    icone: ClipboardList,
    caminho: '/campanhas',
  },
  {
    codigo: 'M2',
    titulo: 'Avaliação',
    descricao: 'Informações que apoiam a análise dos riscos ocupacionais.',
    icone: ScanLine,
    caminho: '/avaliacoes',
  },
  {
    codigo: 'M3',
    titulo: 'Inventário',
    descricao: 'Uma visão organizada dos riscos e de seu histórico.',
    icone: FileStack,
    caminho: '/inventarios',
  },
];

export default function PaginaInicial() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <Link
            href="/"
            aria-label="SISNR1 — página inicial"
            className="flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="rounded-xl bg-primary p-2.5 text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span>
              SIS<span className="text-primary">NR1</span>
            </span>
          </Link>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            Ambiente demonstrativo
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-20">
        <div className="mb-8 flex flex-wrap gap-5">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--color-text-brand)] underline underline-offset-4"
          >
            Acessar painel
          </Link>
          <Link
            href="/cadastro"
            className="text-sm font-medium text-[var(--color-text-brand)] underline underline-offset-4"
          >
            Criar conta
          </Link>
          <Link
            href="/questionario"
            className="text-sm font-medium text-[var(--color-text-brand)] underline underline-offset-4"
          >
            Questionário demonstrativo
          </Link>
          <Link
            href="/usuarios"
            className="text-sm font-medium text-[var(--color-text-brand)] underline underline-offset-4"
          >
            Usuários e vínculos
          </Link>
        </div>
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-[var(--color-text-brand)] uppercase">
          <span className="h-px w-8 bg-primary" /> Cuidado que começa no
          trabalho
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          SISNR1
        </h1>
        <p className="mt-4 text-xl text-slate-700 sm:text-2xl">
          Gestão de riscos ocupacionais
        </p>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
          Da escuta à organização das informações. Um espaço para acompanhar os
          riscos relacionados ao trabalho.
        </p>
        <section aria-labelledby="modulos-titulo" className="mt-14 sm:mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-medium tracking-widest text-slate-500 uppercase">
                Uma jornada em três etapas
              </p>
              <h2
                id="modulos-titulo"
                className="text-2xl font-semibold tracking-tight"
              >
                Módulos do sistema
              </h2>
            </div>
            <span className="text-sm text-slate-500">
              Demonstração local em desenvolvimento
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {modulos.map(
              ({ codigo, titulo, descricao, caminho, icone: Icone }) => (
                <Card
                  key={codigo}
                  className="rounded-2xl border border-slate-200 bg-white py-0 shadow-none"
                >
                  <CardContent className="p-6 sm:p-7">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="rounded-xl bg-secondary p-3 text-[var(--color-text-brand)]">
                        <Icone className="size-6" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {codigo}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold">
                      {codigo} — {titulo}
                    </h3>
                    <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
                      {descricao}
                    </p>
                    <div className="mt-7 border-t border-slate-100 pt-5">
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        Parcialmente implementado
                      </span>
                      <Link
                        href={caminho}
                        className="ml-3 text-xs font-medium text-[var(--color-text-brand)] underline underline-offset-4"
                      >
                        Abrir
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </section>
        <div className="mt-8">
          <EstadoDaApi />
        </div>
        <div className="mt-8 flex items-start gap-3 text-sm leading-6 text-slate-500">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p>
            Projeto acadêmico em desenvolvimento. As demonstrações utilizarão
            exclusivamente dados fictícios.
          </p>
        </div>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t border-slate-200 px-6 py-6 text-xs text-slate-500 sm:px-10">
        <span>SISNR1</span>
        <span>MVP acadêmico · M1–M3 em validação</span>
      </footer>
    </div>
  );
}
