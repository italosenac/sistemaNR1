'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import type {
  DadosEstrutura,
  RegistroEstrutura,
  TipoEstrutura,
} from '@sistemanr1/contratos';
import { useSessao } from './sessao-provider';
import { useConsultaC0 } from '@/lib/use-consulta-c0';
import { consultarApi, esquemaOpcoes } from '@/lib/usuarios';
import { esquemaEstrutura, esquemaSnapshot } from '@/lib/esquemas-c0';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';
const lista = z.array(esquemaEstrutura);
const listaSnapshots = z.array(esquemaSnapshot);
const ROTULOS: Record<TipoEstrutura, string> = {
  estabelecimentos: 'Estabelecimentos',
  setores: 'Setores',
  funcoes: 'Funções',
  turnos: 'Turnos',
  grupos: 'Grupos',
};
const estilo = 'h-10 w-full rounded-lg border bg-white px-3';
export function GestaoEstrutura({ tipo }: { tipo: TipoEstrutura }) {
  const { empresa, obterToken } = useSessao();
  const podeLer = empresa?.capacidades.includes('estrutura:ler');
  const podeEditar = empresa?.capacidades.includes('estrutura:gerenciar');
  const base = `/empresas/${empresa?.id}`;
  const consulta = useConsultaC0(
    podeLer ? base + '/estrutura/' + tipo : null,
    lista,
  );
  const opcoes = useConsultaC0(
    podeLer ? base + '/usuarios/opcoes' : null,
    esquemaOpcoes,
  );
  const snapshots = useConsultaC0(
    podeLer && tipo === 'grupos' ? base + '/estruturas-congeladas' : null,
    listaSnapshots,
  );
  const [atual, setAtual] = useState<RegistroEstrutura | undefined>();
  const [revisao, setRevisao] = useState(0);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [estabelecimento, setEstabelecimento] = useState('');
  async function salvar(dados: DadosEstrutura) {
    setOcupado(true);
    setErro('');
    setSucesso('');
    try {
      await consultarApi(
        base + '/estrutura/' + tipo + (atual ? '/' + atual.id : ''),
        await obterToken(),
        esquemaEstrutura,
        { corpo: dados, metodo: atual ? 'PATCH' : 'POST' },
      );
      consulta.atualizar();
      opcoes.atualizar();
      setAtual(undefined);
      setRevisao((r) => r + 1);
      setSucesso('Cadastro salvo.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }
  async function congelar() {
    setOcupado(true);
    setErro('');
    try {
      await consultarApi(
        base + '/estruturas-congeladas',
        await obterToken(),
        esquemaSnapshot,
        { corpo: { estabelecimentoId: estabelecimento } },
      );
      snapshots.atualizar();
      setSucesso('Fotografia da estrutura preservada.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível congelar.');
    } finally {
      setOcupado(false);
    }
  }
  if (!podeLer)
    return (
      <MensagemDeErro mensagem="Você não tem permissão para consultar a estrutura desta empresa." />
    );
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{ROTULOS[tipo]}</h2>
      {(consulta.erro || opcoes.erro) && (
        <MensagemDeErro mensagem={consulta.erro || opcoes.erro} />
      )}
      {consulta.carregando && <p role="status">Carregando cadastros...</p>}
      <ul className="space-y-3">
        {consulta.dados?.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
          >
            <div>
              <p className="font-medium">{item.nome}</p>
              <p className="text-sm text-slate-600">
                {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
                {item.quantidadeEstimadaTrabalhadores
                  ? ` · ${item.quantidadeEstimadaTrabalhadores} trabalhadores estimados`
                  : ''}
              </p>
            </div>
            {podeEditar && (
              <Button variant="outline" onClick={() => setAtual(item)}>
                Editar {item.nome}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {podeEditar && opcoes.dados && (
        <CamposEstrutura
          key={(atual?.id ?? 'novo') + revisao}
          tipo={tipo}
          atual={atual}
          opcoes={opcoes.dados}
          salvar={salvar}
          ocupado={ocupado}
        />
      )}
      {atual && (
        <Button variant="outline" onClick={() => setAtual(undefined)}>
          Cancelar edição
        </Button>
      )}
      {tipo === 'grupos' && (
        <section className="space-y-3 border-t pt-5">
          <h3 className="font-semibold">Fotografias da estrutura</h3>
          <p className="text-sm text-slate-600">
            Preserve uma revisão de grupos e população para uso futuro.
            Alterações posteriores não modificam a fotografia.
          </p>
          {snapshots.erro && <MensagemDeErro mensagem={snapshots.erro} />}
          <ul>
            {snapshots.dados?.map((s) => (
              <li key={s.id}>
                Revisão {s.revisao} — população {s.populacaoTotal}
              </li>
            ))}
          </ul>
          {podeEditar && (
            <>
              <Label htmlFor="congelar-unidade">
                Estabelecimento da fotografia
              </Label>
              <select
                id="congelar-unidade"
                className={estilo}
                value={estabelecimento}
                onChange={(e) => setEstabelecimento(e.target.value)}
              >
                <option value="">Selecione</option>
                {opcoes.dados?.estabelecimentos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => void congelar()}
                disabled={!estabelecimento || ocupado}
              >
                Congelar estrutura
              </Button>
            </>
          )}
        </section>
      )}
      {erro && <MensagemDeErro mensagem={erro} />}{' '}
      {sucesso && <p role="status">{sucesso}</p>}
    </div>
  );
}
function CamposEstrutura({
  tipo,
  atual,
  opcoes,
  salvar,
  ocupado,
}: {
  tipo: TipoEstrutura;
  atual?: RegistroEstrutura;
  opcoes: z.infer<typeof esquemaOpcoes>;
  salvar: (dados: DadosEstrutura) => Promise<void>;
  ocupado: boolean;
}) {
  const [estabelecimento, setEstabelecimento] = useState(
    atual?.estabelecimentoId ?? '',
  );
  const [setor, setSetor] = useState(atual?.setorId ?? '');
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const dados: DadosEstrutura = {
      nome: String(d.get('nome')).trim(),
      descricao: String(d.get('descricao') ?? ''),
      status: d.get('status') === 'inativo' ? 'inativo' : 'ativo',
    };
    if (tipo === 'estabelecimentos') {
      dados.endereco = String(d.get('endereco') ?? '') || null;
      dados.caracterizacaoAmbiente = String(
        d.get('caracterizacaoAmbiente') ?? '',
      );
    }
    if (tipo === 'setores' || tipo === 'grupos')
      dados.estabelecimentoId = estabelecimento;
    if (tipo === 'turnos') {
      dados.horarioInicio = String(d.get('horarioInicio') ?? '') || null;
      dados.horarioFim = String(d.get('horarioFim') ?? '') || null;
    }
    if (tipo === 'grupos') {
      dados.setorId = setor;
      dados.funcaoId = String(d.get('funcaoId') ?? '') || null;
      dados.turnoId = String(d.get('turnoId') ?? '') || null;
      dados.quantidadeEstimadaTrabalhadores = Number(
        d.get('quantidadeEstimadaTrabalhadores'),
      );
    }
    void salvar(dados);
  }
  return (
    <form onSubmit={enviar} className="space-y-4 rounded-xl bg-slate-50 p-5">
      <h3 className="font-semibold">
        {atual ? 'Editar cadastro' : 'Novo cadastro'}
      </h3>
      <div>
        <Label htmlFor="estrutura-nome">Nome</Label>
        <Input
          id="estrutura-nome"
          name="nome"
          required
          maxLength={150}
          defaultValue={atual?.nome}
        />
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          name="descricao"
          maxLength={2000}
          defaultValue={atual?.descricao}
        />
      </div>
      {tipo === 'estabelecimentos' && (
        <>
          <div>
            <Label htmlFor="endereco">Endereço (opcional)</Label>
            <Input
              id="endereco"
              name="endereco"
              maxLength={500}
              defaultValue={atual?.endereco ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="caracterizacaoAmbiente">
              Caracterização inicial do ambiente
            </Label>
            <Input
              id="caracterizacaoAmbiente"
              name="caracterizacaoAmbiente"
              maxLength={4000}
              defaultValue={atual?.caracterizacaoAmbiente}
            />
          </div>
        </>
      )}
      {(tipo === 'setores' || tipo === 'grupos') && (
        <div>
          <Label htmlFor="estrutura-estabelecimento">Estabelecimento</Label>
          <select
            id="estrutura-estabelecimento"
            required
            className={estilo}
            value={estabelecimento}
            onChange={(e) => {
              setEstabelecimento(e.target.value);
              setSetor('');
            }}
          >
            <option value="">Selecione</option>
            {opcoes.estabelecimentos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
        </div>
      )}
      {tipo === 'grupos' && (
        <>
          <div>
            <Label htmlFor="estrutura-setor">Setor</Label>
            <select
              id="estrutura-setor"
              required
              className={estilo}
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
            >
              <option value="">Selecione</option>
              {opcoes.setores
                .filter((s) => s.estabelecimentoId === estabelecimento)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
            </select>
          </div>
          {(['funcaoId', 'turnoId'] as const).map((campo) => (
            <div key={campo}>
              <Label htmlFor={campo}>
                {campo === 'funcaoId' ? 'Função' : 'Turno'}
              </Label>
              <select
                id={campo}
                name={campo}
                className={estilo}
                defaultValue={atual?.[campo] ?? ''}
              >
                <option value="">Não detalhado</option>
                {(campo === 'funcaoId' ? opcoes.funcoes : opcoes.turnos).map(
                  (i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                    </option>
                  ),
                )}
              </select>
            </div>
          ))}
          <div>
            <Label htmlFor="populacao">
              Quantidade estimada de trabalhadores
            </Label>
            <Input
              id="populacao"
              name="quantidadeEstimadaTrabalhadores"
              type="number"
              required
              min={1}
              max={10000000}
              step={1}
              defaultValue={atual?.quantidadeEstimadaTrabalhadores}
            />
          </div>
        </>
      )}
      {tipo === 'turnos' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(['horarioInicio', 'horarioFim'] as const).map((campo) => (
            <div key={campo}>
              <Label htmlFor={campo}>
                {campo === 'horarioInicio'
                  ? 'Horário de início'
                  : 'Horário de término'}
              </Label>
              <Input
                id={campo}
                name={campo}
                type="time"
                defaultValue={atual?.[campo]?.slice(0, 5) ?? ''}
              />
            </div>
          ))}
        </div>
      )}
      <div>
        <Label htmlFor="estrutura-status">Estado</Label>
        <select
          id="estrutura-status"
          name="status"
          defaultValue={atual?.status ?? 'ativo'}
          className={estilo}
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>
      <Button type="submit" disabled={ocupado}>
        {ocupado ? 'Salvando...' : 'Salvar cadastro'}
      </Button>
    </form>
  );
}
