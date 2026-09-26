'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  CadastroUsuario,
  EmpresaPermitida,
  OpcoesLotacao,
  VincularUsuario,
} from '@sistemanr1/contratos';
import { criarClientePublico } from '@/lib/supabase-publico';
import {
  consultarApi,
  esquemaEmpresas,
  esquemaOpcoes,
  esquemaVinculo,
} from '@/lib/usuarios';
import { FormularioUsuario } from '@/components/formulario-usuario';
import { MensagemDeErro } from '@/components/mensagem-de-erro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AcessoUsuarios() {
  const cliente = useMemo(() => criarClientePublico(), []);
  const [autenticado, definirAutenticado] = useState(false);
  const [empresas, definirEmpresas] = useState<EmpresaPermitida[]>([]);
  const [empresaId, definirEmpresaId] = useState('');
  const [opcoes, definirOpcoes] = useState<OpcoesLotacao | null>(null);
  const [erro, definirErro] = useState('');
  const [ocupado, definirOcupado] = useState(false);

  async function obterToken() {
    const { data } = await cliente!.auth.getSession();
    if (!data.session) throw new Error('Sua sessão expirou. Entre novamente.');
    return data.session.access_token;
  }

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!cliente) return;
    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    definirErro('');
    definirOcupado(true);
    try {
      const { error } = await cliente.auth.signInWithPassword({
        email: String(dados.get('email')).trim(),
        password: String(dados.get('senha')),
      });
      if (error)
        throw new Error(
          'Não foi possível entrar. Confira e-mail, senha e ativação da conta.',
        );
      definirAutenticado(true);
      const permitidas = await consultarApi(
        '/minhas-empresas',
        await obterToken(),
        esquemaEmpresas,
      );
      const gerenciaveis = permitidas.filter(
        (empresa) => empresa.papel === 'gestor',
      );
      definirEmpresas(gerenciaveis);
      definirEmpresaId(gerenciaveis[0]?.id ?? '');
    } catch (erro) {
      definirErro(
        erro instanceof Error ? erro.message : 'Não foi possível entrar.',
      );
    } finally {
      formulario.reset();
      definirOcupado(false);
    }
  }

  useEffect(() => {
    if (!empresaId || !cliente) return;
    const controlador = new AbortController();
    async function carregar() {
      try {
        const { data } = await cliente!.auth.getSession();
        if (!data.session)
          throw new Error('Sua sessão expirou. Entre novamente.');
        const recebidas = await consultarApi(
          `/empresas/${empresaId}/usuarios/opcoes`,
          data.session.access_token,
          esquemaOpcoes,
          { sinal: controlador.signal },
        );
        if (!controlador.signal.aborted) definirOpcoes(recebidas);
      } catch (erro) {
        if (!controlador.signal.aborted)
          definirErro(
            erro instanceof Error
              ? erro.message
              : 'Não foi possível carregar a lotação.',
          );
      }
    }
    void carregar();
    return () => controlador.abort();
  }, [empresaId, cliente]);

  async function sair() {
    await cliente?.auth.signOut({ scope: 'local' });
    definirAutenticado(false);
    definirEmpresas([]);
    definirEmpresaId('');
    definirOpcoes(null);
    definirErro('');
  }
  async function salvar(entrada: CadastroUsuario | VincularUsuario) {
    const destino = 'usuarioId' in entrada ? 'vinculos' : 'usuarios';
    await consultarApi(
      `/empresas/${empresaId}/${destino}`,
      await obterToken(),
      esquemaVinculo,
      { corpo: entrada },
    );
  }

  if (!cliente)
    return (
      <MensagemDeErro mensagem="A autenticação ainda não está configurada neste ambiente." />
    );
  return (
    <div className="space-y-6">
      {!autenticado ? (
        <form onSubmit={entrar} className="mx-auto max-w-md space-y-5">
          <p className="text-sm text-slate-600">
            Entre com uma conta de gestão já autorizada.
          </p>
          <div>
            <Label htmlFor="email-acesso">E-mail</Label>
            <Input
              id="email-acesso"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="senha-acesso">Senha</Label>
            <Input
              id="senha-acesso"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={ocupado} className="h-10 px-5">
            {ocupado ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              A sessão fica somente nesta aba.
            </p>
            <Button variant="outline" onClick={sair}>
              Sair
            </Button>
          </div>
          {empresas.length === 0 && !erro ? (
            <p role="status">
              Sua conta não possui vínculo de gestão ativo. Solicite acesso à
              administração.
            </p>
          ) : null}
          {empresas.length > 0 && (
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <select
                id="empresa"
                value={empresaId}
                onChange={(evento) => {
                  definirOpcoes(null);
                  definirErro('');
                  definirEmpresaId(evento.target.value);
                }}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
          {empresaId && !opcoes && !erro && (
            <p role="status">Carregando opções da empresa...</p>
          )}
          {opcoes && (
            <FormularioUsuario
              key={empresaId}
              opcoes={opcoes}
              aoSalvar={salvar}
            />
          )}
        </>
      )}
      {erro && <MensagemDeErro mensagem={erro} />}
    </div>
  );
}
