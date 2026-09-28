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
import Link from 'next/link';

const campanha = z.object({
  id: z.uuid(),
  titulo: z.string(),
  estado: z.string(),
});
const criterio = z.object({
  id: z.uuid(),
  versao: z.number(),
  assinaturaEstado: z.string(),
  hashPdf: z.string(),
});
const parte = z.object({
  fatorId: z.string(),
  escopoTipo: z.enum(['grupo', 'estabelecimento']),
  escopoId: z.uuid(),
  media: z.number(),
});
const pacote = z.object({
  resultado: z.object({ estado: z.string(), particoes: z.array(parte) }),
});
const resultado = z.object({
  id: z.uuid(),
  valor: z.number(),
  faixa: z.string(),
  decisaoEfetiva: z.string(),
  criterioId: z.uuid(),
  memoria: z.record(z.string(), z.unknown()),
});
const modeloSchema = z.object({
  formula: z.string(),
  severidades: z.array(z.number()),
  probabilidades: z.array(z.number()),
  celulas: z.array(
    z.object({
      severidade: z.number(),
      probabilidade: z.number(),
      faixa: z.string(),
      decisao: z.string(),
    }),
  ),
});
const classeFaixa = (faixa: string) => {
  const valor = faixa.toLowerCase();
  if (valor.includes('crítico') || valor.includes('critico'))
    return 'bg-[var(--color-risk-critical-bg)] text-[var(--color-risk-critical-text)]';
  if (valor.includes('alto'))
    return 'bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high-text)]';
  if (valor.includes('moderado'))
    return 'bg-[var(--color-risk-moderate-bg)] text-[var(--color-risk-moderate-text)]';
  return 'bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low-text)]';
};

export function AvaliacaoDemonstrativa() {
  const { empresa, obterToken } = useSessao();
  const [campanhas, setCampanhas] = useState<z.infer<typeof campanha>[]>([]);
  const [criterios, setCriterios] = useState<z.infer<typeof criterio>[]>([]);
  const [modelo, setModelo] = useState<z.infer<typeof modeloSchema> | null>(
    null,
  );
  const [campanhaId, setCampanhaId] = useState('');
  const [criterioId, setCriterioId] = useState('');
  const [particoes, setParticoes] = useState<z.infer<typeof parte>[]>([]);
  const [particaoId, setParticaoId] = useState('');
  const [resultadoAtual, setResultadoAtual] = useState<z.infer<
    typeof resultado
  > | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const base = `/empresas/${empresa?.id}`;
  const tecnico = empresa?.papeis.includes('responsavel_tecnico');
  const carregar = useCallback(async () => {
    if (!empresa) return;
    const token = await obterToken();
    const [lista, versoes, matriz] = await Promise.all([
      consultarApi(`${base}/campanhas`, token, z.array(campanha)),
      consultarApi(`${base}/avaliacoes/criterios`, token, z.array(criterio)),
      consultarApi(`${base}/avaliacoes/modelo`, token, modeloSchema),
    ]);
    setCampanhas(lista);
    setCriterios(versoes);
    setModelo(matriz);
  }, [base, empresa, obterToken]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar().catch((e: unknown) =>
        setErro(e instanceof Error ? e.message : 'Avaliações indisponíveis.'),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [carregar]);
  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setErro('');
    setAviso('');
    try {
      await acao();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Operação indisponível.');
    } finally {
      setOcupado(false);
    }
  }
  async function carregarPacote(id: string) {
    setCampanhaId(id);
    setParticoes([]);
    setParticaoId('');
    setResultadoAtual(null);
    if (!id) return;
    void executar(async () => {
      const resposta = await consultarApi(
        `${base}/campanhas/${id}/agregados`,
        await obterToken(),
        pacote,
      );
      setParticoes(resposta.resultado.particoes);
      setAviso(
        resposta.resultado.particoes.length
          ? 'Somente partições divulgáveis estão disponíveis.'
          : 'Sem partições divulgáveis. O sistema não atribui risco zero.',
      );
    });
  }
  function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const selecionada = particoes.find(
      (item) => `${item.escopoId}:${item.fatorId}` === particaoId,
    );
    if (!selecionada) {
      setErro('Selecione um agregado publicável.');
      return;
    }
    void executar(async () => {
      const corpo = {
        campanhaId,
        criterioId,
        fatorId: selecionada.fatorId,
        escopoTipo: selecionada.escopoTipo,
        escopoId: selecionada.escopoId,
        perigo: String(dados.get('perigo')),
        severidade: Number(dados.get('severidade')),
        probabilidade: Number(dados.get('probabilidade')),
        justificativaProbabilidade: String(
          dados.get('justificativaProbabilidade'),
        ),
        consequencias: [
          {
            descricao: String(dados.get('consequencia')),
            magnitude: Number(dados.get('severidade')),
          },
        ],
        indiceDeterminante: 0,
        riscoEvidente: dados.get('riscoEvidente') === 'on',
        medidaRegistrada: String(dados.get('medidaRegistrada')),
        ergonomia: String(dados.get('ergonomia')),
        referenciaErgonomia: String(dados.get('referenciaErgonomia')),
      };
      const salvo = await consultarApi(
        `${base}/avaliacoes/resultados`,
        await obterToken(),
        resultado,
        { corpo },
      );
      setResultadoAtual(salvo);
      setAviso('Avaliação M2 persistida com memória e versão exata.');
    });
  }
  if (!empresa) return <p>Selecione uma empresa.</p>;
  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-brand)]">
          Módulo 2 · Avaliação
        </p>
        <h2 className="mt-1 text-2xl font-semibold">
          Matriz e análise de riscos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A avaliação usa somente partições agregadas que passaram pela proteção
          M1.
        </p>
      </div>
      <p className="rounded-xl border border-border bg-[var(--color-bg-audit)] p-4 text-sm text-[var(--color-text-audit)]">
        Modelo acadêmico R = S × P. A média do questionário não define
        automaticamente a probabilidade. O responsável técnico escolhe e
        justifica S e P.
      </p>
      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Critérios versionados</h2>
        {modelo && (
          <div
            className="overflow-x-auto"
            aria-label="Matriz demonstrativa de severidade por probabilidade"
          >
            <div className="grid min-w-[360px] grid-cols-4 gap-2 text-center text-xs sm:text-sm">
              <div className="rounded-lg bg-muted p-2 font-semibold">S × P</div>
              {modelo.probabilidades.map((p) => (
                <div
                  key={`p-${p}`}
                  className="rounded-lg bg-muted p-2 font-semibold"
                >
                  P {p}
                </div>
              ))}
              {modelo.severidades.map((s) => (
                <div key={`s-${s}`} className="contents">
                  <div className="rounded-lg bg-muted p-2 font-semibold">
                    S {s}
                  </div>
                  {modelo.probabilidades.map((p) => {
                    const celula = modelo.celulas.find(
                      (c) => c.severidade === s && c.probabilidade === p,
                    );
                    return (
                      <div
                        key={`${s}-${p}`}
                        className={`rounded-lg p-2 font-medium ${classeFaixa(celula?.faixa ?? '')}`}
                        title={celula?.decisao}
                      >
                        {celula ? (
                          <>
                            <span className="block font-semibold">
                              {celula.faixa}
                            </span>
                            <span className="block text-xs">{s * p}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
        {criterios.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum critério publicado. O responsável técnico pode publicar a
            versão demonstrativa abaixo.
          </p>
        )}
        <ul className="space-y-1 text-sm">
          {criterios.map((c) => (
            <li key={c.id}>
              Versão {c.versao} · {c.assinaturaEstado} · hash PDF{' '}
              {c.hashPdf.slice(0, 12)}…
            </li>
          ))}
        </ul>
        {tecnico && (
          <Button
            disabled={ocupado}
            onClick={() =>
              void executar(async () => {
                const modelo = await consultarApi(
                  `${base}/avaliacoes/modelo`,
                  await obterToken(),
                  modeloSchema,
                );
                const novo = await consultarApi(
                  `${base}/avaliacoes/criterios`,
                  await obterToken(),
                  z.object({ id: z.uuid(), versao: z.number() }),
                  { corpo: { matriz: modelo } },
                );
                setCriterioId(novo.id);
                setAviso(
                  `Versão demonstrativa ${novo.versao} aprovada. PDF não assinado.`,
                );
              })
            }
          >
            Publicar nova versão do modelo demonstrativo
          </Button>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="font-semibold">Avaliar agregado permitido</h2>
        {!campanhas.some((c) => c.estado === 'encerrada') && (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Ainda não há campanha encerrada nesta empresa. Conclua a coleta M1
            para obter agregados protegidos.
          </p>
        )}
        <div>
          <Label htmlFor="avaliacao-campanha">Campanha encerrada</Label>
          <select
            id="avaliacao-campanha"
            className="h-10 w-full rounded-lg border bg-card px-3"
            value={campanhaId}
            onChange={(e) => void carregarPacote(e.target.value)}
          >
            <option value="">Selecione</option>
            {campanhas
              .filter((c) => c.estado === 'encerrada')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label htmlFor="avaliacao-parte">Partição divulgável</Label>
          <select
            id="avaliacao-parte"
            className="h-10 w-full rounded-lg border bg-card px-3"
            value={particaoId}
            onChange={(e) => setParticaoId(e.target.value)}
          >
            <option value="">Selecione</option>
            {particoes.map((p) => (
              <option
                key={`${p.escopoId}:${p.fatorId}`}
                value={`${p.escopoId}:${p.fatorId}`}
              >
                {p.escopoTipo} · {p.fatorId} · média {p.media.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        {tecnico && (
          <form
            onSubmit={registrar}
            className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="avaliacao-criterio">Critério aprovado</Label>
              <select
                id="avaliacao-criterio"
                value={criterioId}
                onChange={(e) => setCriterioId(e.target.value)}
                required
                className="h-10 w-full rounded-lg border bg-card px-3"
              >
                <option value="">Selecione</option>
                {criterios.map((c) => (
                  <option key={c.id} value={c.id}>
                    Versão {c.versao}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="avaliacao-perigo">Perigo contextualizado</Label>
              <Input
                id="avaliacao-perigo"
                name="perigo"
                required
                minLength={3}
              />
            </div>
            <div>
              <Label htmlFor="avaliacao-s">Severidade (S)</Label>
              <select
                id="avaliacao-s"
                name="severidade"
                required
                className="h-10 w-full rounded-lg border bg-card px-3"
              >
                <option value="">Selecione</option>
                {[1, 2, 3].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="avaliacao-p">Probabilidade (P)</Label>
              <select
                id="avaliacao-p"
                name="probabilidade"
                required
                className="h-10 w-full rounded-lg border bg-card px-3"
              >
                <option value="">Selecione</option>
                {[1, 2, 3].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="avaliacao-consequencia">
                Consequência possível determinante
              </Label>
              <Input
                id="avaliacao-consequencia"
                name="consequencia"
                required
                minLength={3}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="avaliacao-justificativa">
                Fundamentação da probabilidade
              </Label>
              <textarea
                id="avaliacao-justificativa"
                name="justificativaProbabilidade"
                required
                minLength={10}
                className="min-h-20 w-full rounded-lg border bg-card p-3"
              />
            </div>
            <div>
              <Label htmlFor="avaliacao-ergonomia">Ergonomia</Label>
              <select
                id="avaliacao-ergonomia"
                name="ergonomia"
                required
                className="h-10 w-full rounded-lg border bg-card px-3"
              >
                <option value="nenhuma">Nenhuma aplicável</option>
                <option value="aep">AEP</option>
                <option value="aet">AET</option>
              </select>
            </div>
            <div>
              <Label htmlFor="avaliacao-referencia">
                Referência AEP/AET, quando aplicável
              </Label>
              <Input id="avaliacao-referencia" name="referenciaErgonomia" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="riscoEvidente" /> Risco evidente no
              checklist
            </label>
            <div>
              <Label htmlFor="avaliacao-medida">
                Medida registrada, se risco evidente
              </Label>
              <Input id="avaliacao-medida" name="medidaRegistrada" />
            </div>
            <Button
              type="submit"
              disabled={ocupado || !particaoId || !criterioId}
            >
              Calcular e registrar
            </Button>
          </form>
        )}
      </section>
      {resultadoAtual && (
        <div role="status" className="space-y-4 rounded-2xl border p-5">
          <div>
            <h3 className="font-semibold">Memória de cálculo</h3>
            <p className="text-sm text-muted-foreground">
              Resultado registrado com a versão selecionada dos critérios.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted p-3">
              <span className="block text-xs text-muted-foreground">Regra</span>
              <strong>
                {String(resultadoAtual.memoria.operacao ?? 'S × P')}
              </strong>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <span className="block text-xs text-muted-foreground">
                Resultado
              </span>
              <strong>{resultadoAtual.valor}</strong>
            </div>
            <div
              className={`rounded-xl p-3 ${classeFaixa(resultadoAtual.faixa)}`}
            >
              <span className="block text-xs">Classificação</span>
              <strong>{resultadoAtual.faixa}</strong>
            </div>
          </div>
          <p className="text-sm">
            Decisão: <strong>{resultadoAtual.decisaoEfetiva}</strong>
          </p>
          <Link
            href="/inventarios"
            className="inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Continuar para o inventário M3 →
          </Link>
        </div>
      )}
      {aviso && (
        <p role="status" className="text-sm text-[var(--color-text-success)]">
          {aviso}
        </p>
      )}
      {erro && <MensagemDeErro mensagem={erro} />}
    </div>
  );
}
