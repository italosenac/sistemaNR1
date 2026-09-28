'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import { useSessao } from './sessao-provider';
import { useConsultaC0 } from '@/lib/use-consulta-c0';
import { consultarApi, esquemaVinculo } from '@/lib/usuarios';
import { esquemaPerfil, esquemaProfissional } from '@/lib/esquemas-c0';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';
const listaProfissionais = z.array(esquemaProfissional);
const listaVinculos = z.array(esquemaVinculo);
export function MeusVinculos() {
  const c = useConsultaC0('/meus-vinculos', listaVinculos);
  if (c.erro) return <MensagemDeErro mensagem={c.erro} />;
  if (c.carregando) return <p role="status">Carregando seus vínculos...</p>;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Vínculos e lotações próprios</h2>
      {c.dados?.length === 0 && <p>Nenhum vínculo ativo.</p>}
      {c.dados?.map((v) => (
        <div key={v.id} className="rounded-lg border p-4">
          <p>Matrícula: {v.matriculaFuncional ?? 'Não informada'}</p>
          <p>Estado: {v.status}</p>
          <p>Papéis: {v.papeis.join(', ') || 'Sem atribuições'}</p>
          <p>Lotação: {v.lotacaoStatus ?? 'Não cadastrada'}</p>
        </div>
      ))}
    </div>
  );
}
export function MeuPerfil() {
  const { perfil, obterToken, atualizar } = useSessao();
  const registros = useConsultaC0(
    '/meu-perfil/registros-profissionais',
    listaProfissionais,
  );
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  const [registroId, definirRegistroId] = useState('');
  async function salvar(e: FormEvent<HTMLFormElement>, profissional = false) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    definirErro('');
    definirSucesso('');
    definirOcupado(true);
    try {
      if (profissional) {
        await consultarApi(
          '/meu-perfil/registros-profissionais' +
            (registroId ? '/' + registroId : ''),
          await obterToken(),
          esquemaProfissional,
          {
            metodo: registroId ? 'PATCH' : 'POST',
            corpo: {
              conselho: String(dados.get('conselho')).trim(),
              numeroRegistro: String(dados.get('numeroRegistro')).trim(),
              uf: String(dados.get('uf')).trim().toUpperCase() || null,
            },
          },
        );
        registros.atualizar();
        definirRegistroId('');
        form.reset();
      } else {
        await consultarApi('/meu-perfil', await obterToken(), esquemaPerfil, {
          metodo: 'PATCH',
          corpo: { nomeCompleto: String(dados.get('nomeCompleto')).trim() },
        });
        await atualizar();
      }
      definirSucesso('Dados atualizados.');
    } catch (e) {
      definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      definirOcupado(false);
    }
  }
  return (
    <div className="space-y-7">
      <form onSubmit={(e) => void salvar(e)} className="space-y-3">
        <Label htmlFor="perfil-nome">Nome completo</Label>
        <Input
          id="perfil-nome"
          name="nomeCompleto"
          defaultValue={perfil?.nomeCompleto}
          minLength={3}
          maxLength={150}
          required
        />
        <p className="break-all text-xs text-slate-600">
          Identificador para associação por um gestor: {perfil?.id}
        </p>
        <Button type="submit" disabled={ocupado}>
          Salvar perfil
        </Button>
      </form>
      <div>
        <h2 className="text-xl font-semibold">
          Identificação profissional opcional
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          O registro informado não comprova habilitação nem representa
          assinatura formal.
        </p>
      </div>
      {registros.erro && <MensagemDeErro mensagem={registros.erro} />}
      <ul className="space-y-2">
        {registros.dados?.map((r) => (
          <li key={r.id}>
            {r.conselho} — {r.numeroRegistro} {r.uf}
            <Button variant="link" onClick={() => definirRegistroId(r.id)}>
              Editar registro
            </Button>
          </li>
        ))}
      </ul>
      <form
        key={registroId}
        onSubmit={(e) => void salvar(e, true)}
        className="grid gap-4 sm:grid-cols-3"
      >
        {[
          { nome: 'conselho', rotulo: 'Órgão ou conselho', max: 100 },
          { nome: 'numeroRegistro', rotulo: 'Número de registro', max: 50 },
          { nome: 'uf', rotulo: 'UF (opcional)', max: 2 },
        ].map((campo) => (
          <div key={campo.nome}>
            <Label htmlFor={campo.nome}>{campo.rotulo}</Label>
            <Input
              id={campo.nome}
              name={campo.nome}
              maxLength={campo.max}
              required={campo.nome !== 'uf'}
              defaultValue={
                campo.nome === 'conselho'
                  ? registros.dados?.find((r) => r.id === registroId)?.conselho
                  : campo.nome === 'numeroRegistro'
                    ? registros.dados?.find((r) => r.id === registroId)
                        ?.numeroRegistro
                    : (registros.dados?.find((r) => r.id === registroId)?.uf ??
                      '')
              }
            />
          </div>
        ))}
        <Button type="submit" disabled={ocupado}>
          {registroId ? 'Salvar registro' : 'Adicionar registro'}
        </Button>
      </form>
      {erro && <MensagemDeErro mensagem={erro} />}{' '}
      {sucesso && <p role="status">{sucesso}</p>}
    </div>
  );
}
