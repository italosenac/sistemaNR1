'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Empresa } from '@sistemanr1/contratos';
import { useSessao } from './sessao-provider';
import { useConsultaC0 } from '@/lib/use-consulta-c0';
import { consultarApi } from '@/lib/usuarios';
import { esquemaEmpresa } from '@/lib/esquemas-c0';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';
export function FormularioEmpresa({ editar = false }: { editar?: boolean }) {
  const { empresa, obterToken, atualizar, informar } = useSessao();
  const permitido = !editar || empresa?.capacidades.includes('empresa:editar');
  const consulta = useConsultaC0(
    editar && permitido ? `/empresas/${empresa!.id}` : null,
    esquemaEmpresa,
  );
  if (!permitido)
    return (
      <MensagemDeErro mensagem="Você não tem permissão para editar esta empresa." />
    );
  if (editar && consulta.erro)
    return <MensagemDeErro mensagem={consulta.erro} />;
  if (editar && !consulta.dados)
    return <p role="status">Carregando empresa...</p>;
  return (
    <CamposEmpresa
      key={consulta.dados?.id ?? 'nova'}
      atual={editar ? consulta.dados! : undefined}
      salvar={async (corpo) => {
        await consultarApi(
          editar ? `/empresas/${empresa!.id}` : '/empresas',
          await obterToken(),
          esquemaEmpresa,
          { corpo, metodo: editar ? 'PATCH' : 'POST' },
        );
        informar(
          editar
            ? 'Empresa atualizada.'
            : 'Empresa criada. Seu vínculo inicial de gestor está disponível.',
        );
        await atualizar();
      }}
    />
  );
}
function CamposEmpresa({
  atual,
  salvar,
}: {
  atual?: Empresa;
  salvar: (corpo: Record<string, unknown>) => Promise<void>;
}) {
  const [erro, setErro] = useState(''),
    [sucesso, setSucesso] = useState(''),
    [ocupado, setOcupado] = useState(false);
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setOcupado(true);
    setErro('');
    setSucesso('');
    try {
      await salvar({
        razaoSocial: String(d.get('razaoSocial')).trim(),
        nomeFantasia: String(d.get('nomeFantasia')).trim() || null,
        cnpj: String(d.get('cnpj')).trim() || null,
        emailCorporativo: String(d.get('emailCorporativo')).trim() || null,
        telefone: String(d.get('telefone')).trim() || null,
        ...(atual ? { status: d.get('status') } : {}),
      });
      setSucesso(
        atual
          ? 'Empresa atualizada.'
          : 'Empresa criada. Seu vínculo inicial de gestor está disponível.',
      );
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível salvar a empresa.',
      );
    } finally {
      setOcupado(false);
    }
  }
  const campos = [
    { nome: 'razaoSocial', rotulo: 'Razão social', tipo: 'text', max: 150 },
    {
      nome: 'nomeFantasia',
      rotulo: 'Nome fantasia (opcional)',
      tipo: 'text',
      max: 150,
    },
    { nome: 'cnpj', rotulo: 'CNPJ (opcional)', tipo: 'text', max: 18 },
    {
      nome: 'emailCorporativo',
      rotulo: 'E-mail corporativo (opcional)',
      tipo: 'email',
      max: 254,
    },
    { nome: 'telefone', rotulo: 'Telefone (opcional)', tipo: 'tel', max: 30 },
  ] as const;
  return (
    <form onSubmit={enviar} className="space-y-5">
      <p className="text-sm text-slate-600">
        Utilize dados fictícios. O CNPJ é opcional; quando informado, seus
        dígitos serão validados.
      </p>
      {campos.map((c) => (
        <div key={c.nome}>
          <Label htmlFor={c.nome}>{c.rotulo}</Label>
          <Input
            id={c.nome}
            name={c.nome}
            type={c.tipo}
            maxLength={c.max}
            minLength={c.nome === 'razaoSocial' ? 3 : undefined}
            required={c.nome === 'razaoSocial'}
            defaultValue={atual?.[c.nome] ?? ''}
          />
        </div>
      ))}
      {atual && (
        <div>
          <Label htmlFor="status-empresa">Estado</Label>
          <select
            id="status-empresa"
            name="status"
            defaultValue={atual.status}
            className="h-10 w-full rounded-lg border px-3"
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <p className="text-sm text-slate-600">
            Inativar a empresa bloqueia seus acessos. A reativação exige
            procedimento operacional autorizado.
          </p>
        </div>
      )}
      <Button type="submit" disabled={ocupado}>
        {ocupado
          ? 'Salvando...'
          : atual
            ? 'Salvar empresa'
            : 'Cadastrar empresa'}
      </Button>
      {erro && <MensagemDeErro mensagem={erro} />}{' '}
      {sucesso && <p role="status">{sucesso}</p>}
    </form>
  );
}
