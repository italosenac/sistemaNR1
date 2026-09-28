'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import { useSessao } from './sessao-provider';
import { consultarApi } from '@/lib/usuarios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';

const avaliacao = z.object({
  id: z.uuid(),
  estabelecimentoId: z.uuid(),
  perigo: z.string(),
  valor: z.number(),
  faixa: z.string(),
  criterioId: z.uuid(),
});
const versao = z.object({
  id: z.uuid(),
  estabelecimentoId: z.uuid(),
  versao: z.number(),
  hashPdf: z.string(),
  assinaturaEstado: z.string(),
  diferencas: z.record(z.string(), z.unknown()),
});
const letras = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const;
const rotulos = {
  a: 'Processos e ambientes',
  b: 'Atividades',
  c: 'Perigos, fontes e circunstâncias',
  d: 'Lesões e agravos possíveis',
  e: 'Grupos expostos',
  f: 'Medidas implementadas',
  g: 'Exposição',
  h: 'Análises e resultados ergonômicos',
  i: 'Avaliação e classificação',
};
const exemplo = {
  a: 'Processo e ambiente fictícios da unidade.',
  b: 'Atividade fictícia do setor.',
  c: 'Fonte e circunstância fictícias do perigo.',
  d: 'Possíveis agravos fictícios, sem diagnóstico.',
  e: 'Grupo fictício do estabelecimento, sem nomes.',
  f: 'Medida fictícia registrada na demonstração.',
  g: 'Exposição qualitativa fictícia da atividade.',
  h: 'Resultado ergonômico fictício identificado.',
  i: 'Classificação sintética preservada da origem.',
};

export function InventarioIntegrado() {
  const { empresa, obterToken } = useSessao();
  const [avaliacoes, setAvaliacoes] = useState<z.infer<typeof avaliacao>[]>([]);
  const [versoes, setVersoes] = useState<z.infer<typeof versao>[]>([]);
  const [avaliacaoId, setAvaliacaoId] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const tecnico = empresa?.papeis.includes('responsavel_tecnico');
  const base = `/empresas/${empresa?.id}`;
  const carregar = useCallback(async () => {
    if (!empresa) return;
    const token = await obterToken();
    const [resultados, inventarios] = await Promise.all([
      consultarApi(`${base}/avaliacoes/resultados`, token, z.array(avaliacao)),
      consultarApi(`${base}/inventarios`, token, z.array(versao)),
    ]);
    setAvaliacoes(resultados);
    setVersoes(inventarios);
  }, [base, empresa, obterToken]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar().catch((e: unknown) =>
        setErro(e instanceof Error ? e.message : 'Inventário indisponível.'),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);
  function consolidar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const selecionada = avaliacoes.find((item) => item.id === avaliacaoId);
    if (!selecionada) {
      setErro('Selecione uma avaliação M2.');
      return;
    }
    const alin = (prefixo: string) =>
      Object.fromEntries(
        letras.map((letra) => [
          letra,
          String(dados.get(`${prefixo}-${letra}`) ?? '').trim(),
        ]),
      );
    setOcupado(true);
    setErro('');
    setAviso('');
    void (async () => {
      try {
        const criado = await consultarApi(
          `${base}/inventarios/consolidacoes`,
          await obterToken(),
          z.object({
            id: z.uuid(),
            versao: z.number(),
            assinaturaEstado: z.string(),
          }),
          {
            corpo: {
              estabelecimentoId: selecionada.estabelecimentoId,
              itensPsicossociais: [{ avaliacaoId, alineas: alin('psico') }],
              itensGerais: [
                {
                  categoria: String(dados.get('categoria')),
                  proveniencia: String(dados.get('proveniencia')),
                  alineas: alin('geral'),
                },
              ],
            },
          },
        );
        setAviso(
          `Versão ${criado.versao} consolidada como ${criado.assinaturaEstado}. PDF disponível abaixo.`,
        );
        await carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Consolidação indisponível.');
      } finally {
        setOcupado(false);
      }
    })();
  }
  async function baixar(id: string) {
    setErro('');
    setOcupado(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const resposta = await fetch(
        `${api.replace(/\/$/, '')}/api/v1${base}/inventarios/${id}/pdf`,
        {
          headers: { Authorization: `Bearer ${await obterToken()}` },
          cache: 'no-store',
        },
      );
      if (
        !resposta.ok ||
        resposta.headers.get('content-type')?.includes('application/pdf') !==
          true
      )
        throw new Error('PDF privado indisponível para este vínculo.');
      const objeto = URL.createObjectURL(await resposta.blob());
      const elo = document.createElement('a');
      elo.href = objeto;
      elo.download = `inventario-${id}.pdf`;
      elo.click();
      window.setTimeout(() => URL.revokeObjectURL(objeto), 60_000);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha no download.');
    } finally {
      setOcupado(false);
    }
  }
  if (!empresa) return <p>Selecione uma empresa.</p>;
  return (
    <div className="space-y-7">
      <div className="rounded-xl border border-[var(--color-border-privacy)] bg-[var(--color-bg-privacy)] p-4 text-sm text-[var(--color-text-privacy)]">
        Integração demonstrativa ao inventário geral. Não são inferidos riscos
        ausentes. O PDF fica como RASCUNHO NÃO ASSINADO e não permite avanço
        formal.
      </div>
      {tecnico && (
        <form onSubmit={consolidar} className="space-y-6">
          <div>
            <Label htmlFor="inventario-avaliacao">Avaliação M2 de origem</Label>
            <select
              id="inventario-avaliacao"
              value={avaliacaoId}
              onChange={(e) => setAvaliacaoId(e.target.value)}
              required
              className="h-10 w-full rounded-lg border bg-card px-3"
            >
              <option value="">Selecione</option>
              {avaliacoes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.perigo} · risco {a.valor} / {a.faixa}
                </option>
              ))}
            </select>
          </div>
          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="font-semibold">Item psicossocial: nove alíneas</h2>
            {letras.map((letra) => (
              <div key={letra}>
                <Label htmlFor={`psico-${letra}`}>
                  {letra}) {rotulos[letra]}
                </Label>
                <textarea
                  id={`psico-${letra}`}
                  name={`psico-${letra}`}
                  minLength={10}
                  maxLength={4000}
                  required
                  defaultValue={exemplo[letra]}
                  className="min-h-16 w-full rounded-lg border bg-card p-3 text-sm"
                />
              </div>
            ))}
          </section>
          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="font-semibold">Base geral fictícia integrada</h2>
            <p className="text-sm text-muted-foreground">
              Revise e substitua os exemplos; cada item deve ter procedência e
              as nove alíneas.
            </p>
            <div>
              <Label htmlFor="inventario-categoria">Categoria</Label>
              <select
                id="inventario-categoria"
                name="categoria"
                className="h-10 w-full rounded-lg border bg-card px-3"
              >
                <option value="fisico">Físico</option>
                <option value="quimico">Químico</option>
                <option value="biologico">Biológico</option>
                <option value="ergonomico">Ergonômico</option>
                <option value="acidentes">Acidentes</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label htmlFor="inventario-proveniencia">
                Proveniência da base geral fictícia
              </Label>
              <Input
                id="inventario-proveniencia"
                name="proveniencia"
                required
                minLength={10}
                defaultValue="Inventário geral sintético da empresa de demonstração."
              />
            </div>
            {letras.map((letra) => (
              <div key={letra}>
                <Label htmlFor={`geral-${letra}`}>
                  {letra}) {rotulos[letra]}
                </Label>
                <textarea
                  id={`geral-${letra}`}
                  name={`geral-${letra}`}
                  minLength={10}
                  maxLength={4000}
                  required
                  defaultValue={exemplo[letra]}
                  className="min-h-16 w-full rounded-lg border bg-card p-3 text-sm"
                />
              </div>
            ))}
          </section>
          <Button type="submit" disabled={ocupado || !avaliacaoId}>
            Consolidar rascunho integrado
          </Button>
        </form>
      )}
      <section className="space-y-3">
        <h2 className="font-semibold">Versões imutáveis</h2>
        {versoes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma versão consolidada.
          </p>
        )}
        <ul className="space-y-3">
          {versoes.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <p className="font-medium">
                  Versão {v.versao} · Rascunho não assinado
                </p>
                <p className="text-xs text-muted-foreground">
                  Hash PDF: {v.hashPdf.slice(0, 16)}… · Estabelecimento{' '}
                  {v.estabelecimentoId}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={ocupado}
                onClick={() => void baixar(v.id)}
              >
                Baixar PDF privado
              </Button>
            </li>
          ))}
        </ul>
      </section>
      {aviso && (
        <p role="status" className="text-sm text-[var(--color-text-success)]">
          {aviso}
        </p>
      )}
      {erro && <MensagemDeErro mensagem={erro} />}
    </div>
  );
}
