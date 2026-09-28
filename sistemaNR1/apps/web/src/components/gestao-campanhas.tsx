'use client';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import { useSessao } from './sessao-provider';
import { consultarApi } from '@/lib/usuarios';
import { esquemaEstrutura, esquemaSnapshot } from '@/lib/esquemas-c0';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';
import Link from 'next/link';

const campanhaSchema = z.object({
  id: z.uuid(),
  titulo: z.string(),
  estado: z.string(),
  estabelecimentoId: z.uuid(),
  inicio: z.string(),
  fim: z.string(),
  fuso: z.string(),
});
const pacoteSchema = z.object({
  fotografiaId: z.uuid(),
  registroConsultaId: z.uuid(),
  resultado: z.object({
    estado: z.string(),
    particoes: z.array(
      z.object({
        escopoTipo: z.string(),
        escopoId: z.uuid(),
        fatorId: z.string(),
        media: z.number(),
      }),
    ),
  }),
});
type Campanha = z.infer<typeof campanhaSchema>;

export function GestaoCampanhas() {
  const { empresa, obterToken } = useSessao();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [grupos, setGrupos] = useState<z.infer<typeof esquemaEstrutura>[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<
    z.infer<typeof esquemaEstrutura>[]
  >([]);
  const [fotografias, setFotografias] = useState<
    z.infer<typeof esquemaSnapshot>[]
  >([]);
  const [campanhaId, setCampanhaId] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [fotografiaId, setFotografiaId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pacote, setPacote] = useState<z.infer<typeof pacoteSchema> | null>(
    null,
  );
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const gestor = empresa?.papeis.includes('gestor_sst_rh');
  const base = `/empresas/${empresa?.id}`;
  const carregar = useCallback(async () => {
    if (!empresa) return;
    const token = await obterToken();
    const [lista, gruposRecebidos, estabelecimentosRecebidos, fotos] =
      await Promise.all([
        consultarApi(`${base}/campanhas`, token, z.array(campanhaSchema)),
        consultarApi(
          `${base}/estrutura/grupos`,
          token,
          z.array(esquemaEstrutura),
        ),
        consultarApi(
          `${base}/estrutura/estabelecimentos`,
          token,
          z.array(esquemaEstrutura),
        ),
        consultarApi(
          `${base}/estruturas-congeladas`,
          token,
          z.array(esquemaSnapshot),
        ),
      ]);
    setCampanhas(lista);
    setGrupos(gruposRecebidos);
    setEstabelecimentos(estabelecimentosRecebidos);
    setFotografias(fotos);
  }, [base, empresa, obterToken]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar().catch((e: unknown) =>
        setErro(
          e instanceof Error
            ? e.message
            : 'Não foi possível carregar campanhas.',
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);
  async function executar(acao: () => Promise<void>) {
    setErro('');
    setAviso('');
    setOcupado(true);
    try {
      await acao();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Operação indisponível.');
    } finally {
      setOcupado(false);
    }
  }
  function criar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    void executar(async () => {
      const criado = await consultarApi(
        `${base}/campanhas`,
        await obterToken(),
        z.object({ id: z.uuid() }),
        {
          corpo: {
            estabelecimentoId: String(dados.get('estabelecimentoId')),
            titulo: String(dados.get('titulo')),
            inicio: new Date(String(dados.get('inicio'))).toISOString(),
            fim: new Date(String(dados.get('fim'))).toISOString(),
            fuso: 'America/Sao_Paulo',
            metaPercentual: Number(dados.get('metaPercentual')),
            canalDivulgacao: String(dados.get('canalDivulgacao')),
            canalAlternativo: String(dados.get('canalAlternativo')),
          },
        },
      );
      setCampanhaId(criado.id);
      setAviso('Campanha fictícia criada como rascunho.');
    });
  }
  if (!empresa) return <p>Selecione uma empresa para consultar campanhas.</p>;
  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-brand)]">
          Módulo 1 · Coleta
        </p>
        <h2 className="mt-1 text-2xl font-semibold">Campanhas e resultados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie a campanha, associe grupos, publique e acompanhe somente os
          agregados permitidos.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-border-privacy)] bg-[var(--color-bg-privacy)] p-4 text-sm text-[var(--color-text-privacy)]">
        Coleta anônima demonstrativa. O gestor vê somente agregados liberados
        após o encerramento; grupos com menos de sete respostas permanecem
        protegidos.
      </div>
      {gestor && (
        <form
          onSubmit={criar}
          className="grid gap-4 rounded-2xl border bg-[var(--color-bg-canvas)] p-5 sm:grid-cols-2"
        >
          <h2 className="font-semibold sm:col-span-2">Nova campanha</h2>
          <div>
            <Label htmlFor="camp-titulo">Título</Label>
            <Input id="camp-titulo" name="titulo" required minLength={3} />
          </div>
          <div>
            <Label htmlFor="camp-estabelecimento">Estabelecimento</Label>
            <select
              id="camp-estabelecimento"
              name="estabelecimentoId"
              required
              className="h-10 w-full rounded-lg border bg-card px-3"
            >
              <option value="">Selecione</option>
              {estabelecimentos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="camp-inicio">Início</Label>
            <Input
              id="camp-inicio"
              name="inicio"
              type="datetime-local"
              required
            />
          </div>
          <div>
            <Label htmlFor="camp-fim">Fim</Label>
            <Input id="camp-fim" name="fim" type="datetime-local" required />
          </div>
          <div>
            <Label htmlFor="camp-meta">Meta de adesão (%)</Label>
            <Input
              id="camp-meta"
              name="metaPercentual"
              type="number"
              min="0"
              max="100"
              defaultValue="50"
              required
            />
          </div>
          <div>
            <Label htmlFor="camp-canal">Canal de divulgação</Label>
            <Input
              id="camp-canal"
              name="canalDivulgacao"
              required
              minLength={3}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="camp-alternativo">
              Canal alternativo sem smartphone
            </Label>
            <Input
              id="camp-alternativo"
              name="canalAlternativo"
              required
              minLength={10}
            />
          </div>
          <Button
            type="submit"
            disabled={ocupado || estabelecimentos.length === 0}
          >
            Criar rascunho
          </Button>
        </form>
      )}
      {gestor && estabelecimentos.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Cadastre um estabelecimento na estrutura antes de criar a campanha.{' '}
          <Link href="/estabelecimentos" className="font-medium underline">
            Abrir estabelecimentos
          </Link>
        </p>
      )}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Campanhas da empresa</h2>
        {campanhas.length === 0 && (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Nenhuma campanha nesta empresa. Use o formulário acima para criar o
            primeiro rascunho.
          </p>
        )}
        <select
          aria-label="Campanha selecionada"
          value={campanhaId}
          onChange={(e) => {
            setCampanhaId(e.target.value);
            setCodigo('');
            setPacote(null);
          }}
          className="h-10 w-full rounded-lg border bg-card px-3"
        >
          <option value="">Selecione uma campanha</option>
          {campanhas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titulo} — {c.estado}
            </option>
          ))}
        </select>
        {campanhaId && (
          <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
            {gestor && (
              <>
                <select
                  aria-label="Grupo autorizado"
                  value={grupoId}
                  onChange={(e) => setGrupoId(e.target.value)}
                  className="h-10 rounded-lg border bg-card px-3"
                >
                  <option value="">Selecione grupo</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  disabled={ocupado || !grupoId}
                  onClick={() =>
                    void executar(async () => {
                      await consultarApi(
                        `${base}/campanhas/${campanhaId}/grupos`,
                        await obterToken(),
                        z.object({ adicionado: z.boolean() }),
                        {
                          corpo: {
                            grupoId,
                            populacaoEsperada:
                              grupos.find((g) => g.id === grupoId)
                                ?.quantidadeEstimadaTrabalhadores ?? 0,
                          },
                        },
                      );
                      setAviso('Grupo adicionado ao rascunho.');
                    })
                  }
                >
                  Adicionar grupo
                </Button>
                <select
                  aria-label="Fotografia da estrutura"
                  value={fotografiaId}
                  onChange={(e) => setFotografiaId(e.target.value)}
                  className="h-10 rounded-lg border bg-card px-3"
                >
                  <option value="">Selecione fotografia</option>
                  {fotografias.map((f) => (
                    <option key={f.id} value={f.id}>
                      Revisão {f.revisao} — {f.populacaoTotal} trabalhadores
                      estimados
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  disabled={ocupado || !fotografiaId}
                  onClick={() =>
                    void executar(async () => {
                      await consultarApi(
                        `${base}/campanhas/${campanhaId}/publicacao`,
                        await obterToken(),
                        z.object({ publicada: z.boolean() }),
                        { corpo: { estruturaCongeladaId: fotografiaId } },
                      );
                      setAviso('Campanha publicada.');
                    })
                  }
                >
                  Publicar
                </Button>
                {fotografias.length === 0 && (
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    Ainda não há fotografia da estrutura. Prepare os grupos e
                    congele a estrutura antes da publicação.{' '}
                    <Link
                      href="/grupos"
                      className="font-medium text-primary underline"
                    >
                      Abrir grupos
                    </Link>
                  </p>
                )}
                <Button
                  variant="outline"
                  disabled={ocupado || !grupoId}
                  onClick={() =>
                    void executar(async () => {
                      const resposta = await consultarApi(
                        `${base}/campanhas/${campanhaId}/codigos`,
                        await obterToken(),
                        z.object({ codigo: z.string() }),
                        { corpo: { grupoId } },
                      );
                      setCodigo(resposta.codigo);
                      setAviso(
                        'Código emitido. Copie uma única vez para o participante fictício.',
                      );
                    })
                  }
                >
                  Emitir código individual
                </Button>
                <Button
                  variant="outline"
                  disabled={ocupado}
                  onClick={() =>
                    void executar(async () => {
                      await consultarApi(
                        `${base}/campanhas/${campanhaId}/encerramento`,
                        await obterToken(),
                        z.object({ registroConsultaId: z.uuid() }),
                        { corpo: {} },
                      );
                      setAviso(
                        'Campanha encerrada e fotografia agregada preservada.',
                      );
                    })
                  }
                >
                  Encerrar após a janela
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              disabled={ocupado}
              onClick={() =>
                void executar(async () => {
                  const resultado = await consultarApi(
                    `${base}/campanhas/${campanhaId}/agregados`,
                    await obterToken(),
                    pacoteSchema,
                  );
                  setPacote(resultado);
                })
              }
            >
              Consultar agregados
            </Button>
          </div>
        )}
        {codigo && (
          <div
            role="status"
            className="space-y-3 rounded-xl border border-[var(--color-border-privacy)] bg-[var(--color-bg-privacy)] p-4 text-sm text-[var(--color-text-privacy)]"
          >
            <p className="font-semibold">Código individual de uso único</p>
            <code className="block break-all rounded-lg bg-white p-3 font-mono text-base">
              {codigo}
            </code>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(codigo)
                    .then(() => setAviso('Código copiado.'))
                }
              >
                Copiar código
              </Button>
              <Link href="/questionario" className="font-medium underline">
                Abrir questionário
              </Link>
            </div>
            <p>
              Compartilhe somente com participante fictício. Não associe o
              código ao nome de quem responde.
            </p>
          </div>
        )}
        {pacote && (
          <div role="status" className="rounded-xl border p-4">
            <p className="font-semibold">
              Resultado: {pacote.resultado.estado}
            </p>
            {pacote.resultado.particoes.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {pacote.resultado.particoes.map((p) => (
                  <li key={`${p.escopoId}-${p.fatorId}`}>
                    {p.escopoTipo} · {p.fatorId}: média {p.media.toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded-lg border border-[var(--color-border-privacy)] bg-[var(--color-bg-privacy)] p-3 text-sm text-[var(--color-text-privacy)]">
                Resultado indisponível para preservar o anonimato deste grupo.
                Não é risco zero.
              </p>
            )}
            {pacote.resultado.particoes.length > 0 && (
              <Link
                href="/avaliacoes"
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Avaliar riscos em M2 →
              </Link>
            )}
          </div>
        )}
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
