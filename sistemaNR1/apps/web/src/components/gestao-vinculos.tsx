'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import { PAPEIS_USUARIO } from '@sistemanr1/contratos';
import type { VinculoUsuario } from '@sistemanr1/contratos';
import { useSessao } from './sessao-provider';
import { useConsultaC0 } from '@/lib/use-consulta-c0';
import { consultarApi, esquemaOpcoes, esquemaVinculo } from '@/lib/usuarios';
import { esquemaAtribuicao } from '@/lib/esquemas-c0';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';
const listaVinculos = z.array(esquemaVinculo),
  listaPapeis = z.array(esquemaAtribuicao),
  revogado = z.object({ revogado: z.literal(true) });
const estilo = 'h-10 w-full rounded-lg border bg-white px-3';
export function GestaoVinculos({
  aba = 'vinculos',
}: {
  aba?: 'vinculos' | 'papeis' | 'lotacoes';
}) {
  const { empresa, obterToken, perfil } = useSessao();
  const permitido = empresa?.capacidades.includes('usuarios:gerenciar');
  const base = `/empresas/${empresa?.id}`;
  const consulta = useConsultaC0(
    permitido ? base + '/usuarios' : null,
    listaVinculos,
  );
  const opcoes = useConsultaC0(
    permitido ? base + '/usuarios/opcoes' : null,
    esquemaOpcoes,
  );
  const [selecionado, setSelecionado] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [motivo, setMotivo] = useState('');
  const alvo = consulta.dados?.find((v) => v.id === selecionado);
  const atribuicoes = useConsultaC0(
    permitido && alvo ? base + '/vinculos/' + alvo.id + '/papeis' : null,
    listaPapeis,
  );
  async function executar(acao: () => Promise<unknown>) {
    setOcupado(true);
    setErro('');
    setSucesso('');
    try {
      await acao();
      consulta.atualizar();
      atribuicoes.atualizar();
      setSucesso('Alteração salva.');
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível alterar o vínculo.',
      );
    } finally {
      setOcupado(false);
    }
  }
  async function salvarVinculo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    await executar(async () =>
      consultarApi(
        base + '/vinculos/' + alvo!.id,
        await obterToken(),
        esquemaVinculo,
        {
          metodo: 'PATCH',
          corpo: {
            matriculaFuncional:
              String(d.get('matriculaFuncional')).trim() || null,
            status: d.get('status'),
          },
        },
      ),
    );
  }
  async function conceder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    await executar(async () =>
      consultarApi(
        base + '/vinculos/' + alvo!.id + '/papeis',
        await obterToken(),
        esquemaAtribuicao,
        { corpo: { papel: d.get('papel'), motivo } },
      ),
    );
  }
  if (!permitido)
    return (
      <MensagemDeErro mensagem="Você não tem permissão para gerenciar vínculos nesta empresa." />
    );
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">
        {
          {
            vinculos: 'Vínculos e matrículas',
            papeis: 'Atribuições de papéis',
            lotacoes: 'Lotações',
          }[aba]
        }
      </h2>
      {consulta.erro && <MensagemDeErro mensagem={consulta.erro} />}
      <Label htmlFor="vinculo-alvo">Pessoa vinculada</Label>
      <select
        id="vinculo-alvo"
        className={estilo}
        value={selecionado}
        onChange={(e) => {
          setSelecionado(e.target.value);
          setErro('');
          setSucesso('');
        }}
      >
        <option value="">Selecione</option>
        {consulta.dados?.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nomeCompleto} — {v.matriculaFuncional ?? 'Sem matrícula'} (
            {v.status})
          </option>
        ))}
      </select>
      {alvo && aba === 'vinculos' && (
        <form
          key={alvo.id}
          onSubmit={(e) => void salvarVinculo(e)}
          className="space-y-4"
        >
          <Label htmlFor="editar-matricula">Matrícula funcional</Label>
          <Input
            id="editar-matricula"
            name="matriculaFuncional"
            maxLength={50}
            defaultValue={alvo.matriculaFuncional ?? ''}
          />
          <Label htmlFor="vinculo-status">Estado do vínculo</Label>
          <select
            id="vinculo-status"
            name="status"
            className={estilo}
            defaultValue={alvo.status}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <Button type="submit" disabled={ocupado}>
            Salvar vínculo
          </Button>
        </form>
      )}
      {alvo && aba === 'papeis' && (
        <div className="space-y-4">
          {atribuicoes.erro && <MensagemDeErro mensagem={atribuicoes.erro} />}
          <Label htmlFor="motivo-papel">Motivo da alteração</Label>
          <Input
            id="motivo-papel"
            value={motivo}
            maxLength={500}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <ul className="space-y-2">
            {!atribuicoes.carregando &&
              atribuicoes.dados?.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3">
                  <span>
                    {a.papel} — {a.status}
                  </span>
                  {a.status === 'ativo' && (
                    <Button
                      variant="outline"
                      disabled={
                        ocupado ||
                        motivo.trim().length < 3 ||
                        alvo.usuarioId === perfil?.id
                      }
                      onClick={() =>
                        void executar(async () =>
                          consultarApi(
                            base +
                              '/vinculos/' +
                              alvo.id +
                              '/papeis/' +
                              a.id +
                              '/revogacao',
                            await obterToken(),
                            revogado,
                            { corpo: { motivo } },
                          ),
                        )
                      }
                    >
                      Revogar {a.papel}
                    </Button>
                  )}
                </li>
              ))}
          </ul>
          <form onSubmit={(e) => void conceder(e)} className="space-y-3">
            <Label htmlFor="novo-papel">Novo papel</Label>
            <select id="novo-papel" name="papel" className={estilo}>
              {PAPEIS_USUARIO.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              disabled={
                ocupado ||
                motivo.trim().length < 3 ||
                alvo.usuarioId === perfil?.id ||
                alvo.status !== 'ativo'
              }
            >
              Conceder papel
            </Button>
          </form>
          {alvo.usuarioId === perfil?.id && (
            <p className="text-sm text-slate-600">
              Seus papéis só podem ser alterados por outro gestor autorizado.
            </p>
          )}
        </div>
      )}
      {alvo && aba === 'lotacoes' && opcoes.dados && (
        <EditarLotacao
          key={alvo.id}
          alvo={alvo}
          opcoes={opcoes.dados}
          ocupado={ocupado}
          salvar={(corpo) =>
            executar(async () =>
              consultarApi(
                base + '/vinculos/' + alvo.id + '/lotacao',
                await obterToken(),
                esquemaVinculo,
                { corpo },
              ),
            )
          }
        />
      )}
      {erro && <MensagemDeErro mensagem={erro} />}{' '}
      {sucesso && <p role="status">{sucesso}</p>}
    </div>
  );
}
function EditarLotacao({
  alvo,
  opcoes,
  ocupado,
  salvar,
}: {
  alvo: VinculoUsuario;
  opcoes: z.infer<typeof esquemaOpcoes>;
  ocupado: boolean;
  salvar: (corpo: unknown) => Promise<void>;
}) {
  const [estabelecimento, setEstabelecimento] = useState(
    alvo.estabelecimentoId ?? '',
  );
  const [setor, setSetor] = useState(alvo.setorId ?? '');
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    void salvar({
      estabelecimentoId: estabelecimento || null,
      setorId: setor || null,
      funcaoId: String(d.get('funcaoId')) || null,
      turnoId: String(d.get('turnoId')) || null,
      status: d.get('status'),
    });
  }
  return (
    <form onSubmit={enviar} className="space-y-4">
      <Label htmlFor="lotacao-estabelecimento">Estabelecimento</Label>
      <select
        id="lotacao-estabelecimento"
        className={estilo}
        value={estabelecimento}
        onChange={(e) => {
          setEstabelecimento(e.target.value);
          setSetor('');
        }}
      >
        <option value="">Não se aplica</option>
        {opcoes.estabelecimentos.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>
      <Label htmlFor="lotacao-setor">Setor</Label>
      <select
        id="lotacao-setor"
        className={estilo}
        value={setor}
        onChange={(e) => setSetor(e.target.value)}
        disabled={!estabelecimento}
      >
        <option value="">Não se aplica</option>
        {opcoes.setores
          .filter((s) => s.estabelecimentoId === estabelecimento)
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
      </select>
      {(['funcaoId', 'turnoId'] as const).map((c) => (
        <div key={c}>
          <Label htmlFor={'lotacao-' + c}>
            {c === 'funcaoId' ? 'Função' : 'Turno'}
          </Label>
          <select
            id={'lotacao-' + c}
            name={c}
            className={estilo}
            defaultValue={alvo[c] ?? ''}
          >
            <option value="">Não se aplica</option>
            {(c === 'funcaoId' ? opcoes.funcoes : opcoes.turnos).map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
      ))}
      <Label htmlFor="lotacao-status">Estado da lotação</Label>
      <select
        id="lotacao-status"
        name="status"
        className={estilo}
        defaultValue={alvo.lotacaoStatus ?? 'ativo'}
      >
        <option value="ativo">Ativa</option>
        <option value="inativo">Inativa</option>
      </select>
      <Button type="submit" disabled={ocupado}>
        Salvar lotação
      </Button>
    </form>
  );
}
