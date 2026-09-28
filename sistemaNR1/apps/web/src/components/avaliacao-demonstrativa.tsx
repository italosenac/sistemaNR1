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

export function AvaliacaoDemonstrativa() {
  const { empresa, obterToken } = useSessao();
  const [campanhas, setCampanhas] = useState<z.infer<typeof campanha>[]>([]);
  const [criterios, setCriterios] = useState<z.infer<typeof criterio>[]>([]);
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
    const [lista, versoes] = await Promise.all([
      consultarApi(`${base}/campanhas`, token, z.array(campanha)),
      consultarApi(`${base}/avaliacoes/criterios`, token, z.array(criterio)),
    ]);
    setCampanhas(lista);
    setCriterios(versoes);
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
      <p className="rounded-xl border border-border bg-[var(--color-bg-audit)] p-4 text-sm text-[var(--color-text-audit)]">
        Modelo acadêmico R = S × P. A média do questionário não define
        automaticamente a probabilidade. O responsável técnico escolhe e
        justifica S e P.
      </p>
      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Critérios versionados</h2>
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
                  z.object({
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
                  }),
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
        <div role="status" className="rounded-xl border p-4">
          <p className="font-semibold">
            Resultado persistido: {resultadoAtual.valor} · faixa{' '}
            {resultadoAtual.faixa} · decisão {resultadoAtual.decisaoEfetiva}
          </p>
          <p className="text-sm">
            Memória: {String(resultadoAtual.memoria.operacao)}. Critério{' '}
            {resultadoAtual.criterioId}.
          </p>
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
