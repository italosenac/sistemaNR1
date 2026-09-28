'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PAPEIS_USUARIO } from '@sistemanr1/contratos';
import type {
  CadastroUsuario,
  OpcoesLotacao,
  VincularUsuario,
} from '@sistemanr1/contratos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MensagemDeErro } from '@/components/mensagem-de-erro';
import { useState } from 'react';

const esquema = z
  .object({
    modo: z.enum(['novo', 'existente']),
    nomeCompleto: z.string(),
    email: z.string(),
    senha: z.string(),
    usuarioId: z.string(),
    matriculaFuncional: z.string().trim().max(50, 'Use até 50 caracteres.'),
    papeis: z.array(z.enum(PAPEIS_USUARIO)),
    motivo: z
      .string()
      .trim()
      .min(3, 'Informe o motivo da associação.')
      .max(500),
    estabelecimentoId: z.string(),
    setorId: z.string(),
    funcaoId: z.string(),
    turnoId: z.string(),
  })
  .superRefine((dados, contexto) => {
    if (dados.modo === 'novo') {
      if (
        dados.nomeCompleto.trim().length < 3 ||
        dados.nomeCompleto.trim().length > 150
      )
        contexto.addIssue({
          code: 'custom',
          path: ['nomeCompleto'],
          message: 'Informe o nome completo, de 3 a 150 caracteres.',
        });
      if (!z.email().max(254).safeParse(dados.email.trim()).success)
        contexto.addIssue({
          code: 'custom',
          path: ['email'],
          message: 'Informe um e-mail válido.',
        });
      if (dados.senha.length < 12 || dados.senha.length > 128)
        contexto.addIssue({
          code: 'custom',
          path: ['senha'],
          message: 'Use uma senha de 12 a 128 caracteres.',
        });
    } else if (!z.uuid().safeParse(dados.usuarioId.trim()).success)
      contexto.addIssue({
        code: 'custom',
        path: ['usuarioId'],
        message: 'Informe o identificador válido da conta existente.',
      });
    for (const campo of [
      'estabelecimentoId',
      'setorId',
      'funcaoId',
      'turnoId',
    ] as const) {
      if (dados[campo] && !z.uuid().safeParse(dados[campo]).success)
        contexto.addIssue({
          code: 'custom',
          path: [campo],
          message: 'Selecione uma referência válida.',
        });
    }
    if (dados.setorId && !dados.estabelecimentoId)
      contexto.addIssue({
        code: 'custom',
        path: ['setorId'],
        message: 'Selecione primeiro o estabelecimento.',
      });
  });
type DadosFormulario = z.infer<typeof esquema>;

export function FormularioUsuario({
  opcoes,
  aoSalvar,
}: {
  opcoes: OpcoesLotacao;
  aoSalvar: (entrada: CadastroUsuario | VincularUsuario) => Promise<void>;
}) {
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState('');
  const {
    register,
    control,
    handleSubmit,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<DadosFormulario>({
    resolver: zodResolver(esquema),
    defaultValues: {
      modo: 'novo',
      nomeCompleto: '',
      email: '',
      senha: '',
      usuarioId: '',
      matriculaFuncional: '',
      papeis: ['trabalhador'],
      motivo: 'Cadastro autorizado',
      estabelecimentoId: '',
      setorId: '',
      funcaoId: '',
      turnoId: '',
    },
  });
  const modo = useWatch({ control, name: 'modo' });
  const estabelecimentoId = useWatch({ control, name: 'estabelecimentoId' });
  const setor = opcoes.setores.filter(
    (item) => item.estabelecimentoId === estabelecimentoId,
  );
  const estiloSelect =
    'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm';
  function mensagem(campo: keyof DadosFormulario) {
    return errors[campo] ? (
      <p id={campo + '-erro'} className="mt-1 text-sm text-red-700">
        {errors[campo]?.message}
      </p>
    ) : null;
  }
  async function salvar(dados: DadosFormulario) {
    definirErro('');
    definirSucesso('');
    const vinculo = {
      matriculaFuncional: dados.matriculaFuncional || null,
      papeis: dados.papeis,
      motivo: dados.motivo,
      ...(dados.estabelecimentoId
        ? { estabelecimentoId: dados.estabelecimentoId }
        : {}),
      ...(dados.setorId ? { setorId: dados.setorId } : {}),
      ...(dados.funcaoId ? { funcaoId: dados.funcaoId } : {}),
      ...(dados.turnoId ? { turnoId: dados.turnoId } : {}),
    };
    try {
      await aoSalvar(
        dados.modo === 'novo'
          ? {
              ...vinculo,
              nomeCompleto: dados.nomeCompleto.trim(),
              email: dados.email.trim(),
              senha: dados.senha,
            }
          : { ...vinculo, usuarioId: dados.usuarioId.trim() },
      );
      definirSucesso(
        dados.modo === 'novo'
          ? 'Conta e vínculo cadastrados. Confirme o e-mail pelo fluxo de recuperação antes do primeiro acesso.'
          : 'Vínculo cadastrado sem alterar as credenciais da conta.',
      );
    } catch (erro) {
      definirErro(
        erro instanceof Error ? erro.message : 'Não foi possível salvar.',
      );
    } finally {
      resetField('senha');
    }
  }
  return (
    <form onSubmit={handleSubmit(salvar)} noValidate className="space-y-6">
      <div>
        <Label htmlFor="modo">Tipo de cadastro</Label>
        <select
          id="modo"
          className={estiloSelect}
          {...register('modo', {
            onChange: () => {
              resetField('senha');
              definirErro('');
              definirSucesso('');
            },
          })}
        >
          <option value="novo">Nova conta</option>
          <option value="existente">Vincular conta existente</option>
        </select>
      </div>
      {modo === 'novo' ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="nomeCompleto">Nome completo</Label>
            <Input
              id="nomeCompleto"
              autoComplete="name"
              maxLength={150}
              aria-invalid={Boolean(errors.nomeCompleto)}
              aria-describedby="nomeCompleto-erro"
              {...register('nomeCompleto')}
            />
            {mensagem('nomeCompleto')}
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              aria-invalid={Boolean(errors.email)}
              aria-describedby="email-erro"
              {...register('email')}
            />
            {mensagem('email')}
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              maxLength={128}
              aria-invalid={Boolean(errors.senha)}
              aria-describedby="senha-ajuda senha-erro"
              {...register('senha')}
            />
            <p id="senha-ajuda" className="mt-1 text-xs text-slate-500">
              De 12 a 128 caracteres. A senha não será exibida após o envio.
            </p>
            {mensagem('senha')}
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="usuarioId">Identificador da conta existente</Label>
          <Input
            id="usuarioId"
            autoComplete="off"
            aria-invalid={Boolean(errors.usuarioId)}
            aria-describedby="usuarioId-erro"
            {...register('usuarioId')}
          />
          {mensagem('usuarioId')}
          <p className="mt-2 text-sm text-slate-600">
            A nova matrícula vale somente para esta empresa. Nome, e-mail e
            senha da conta serão preservados.
          </p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="matriculaFuncional">Matrícula funcional</Label>
          <Input
            id="matriculaFuncional"
            maxLength={50}
            autoComplete="off"
            aria-invalid={Boolean(errors.matriculaFuncional)}
            aria-describedby="matriculaFuncional-erro"
            {...register('matriculaFuncional')}
          />
          {mensagem('matriculaFuncional')}
        </div>
        <div>
          <fieldset className="space-y-2">
            <legend className="font-medium">Papéis nesta empresa</legend>
            {PAPEIS_USUARIO.map((papel) => (
              <label key={papel} className="flex gap-2 text-sm">
                <input type="checkbox" value={papel} {...register('papeis')} />
                {
                  {
                    trabalhador: 'Trabalhador',
                    gestor_sst_rh: 'Gestor SST/RH',
                    responsavel_tecnico: 'Responsável técnico',
                    consultoria: 'Consultoria',
                  }[papel]
                }
              </label>
            ))}
          </fieldset>
        </div>
      </div>
      <div>
        <Label htmlFor="motivo">Motivo da associação</Label>
        <Input id="motivo" {...register('motivo')} />
        {mensagem('motivo')}
      </div>
      <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
        <legend className="px-2 font-medium">Lotação, quando aplicável</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="estabelecimentoId">Estabelecimento</Label>
            <select
              id="estabelecimentoId"
              className={estiloSelect}
              {...register('estabelecimentoId', {
                onChange: () => setValue('setorId', ''),
              })}
            >
              <option value="">Não se aplica</option>
              {opcoes.estabelecimentos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            {mensagem('estabelecimentoId')}
          </div>
          <div>
            <Label htmlFor="setorId">Setor</Label>
            <select
              id="setorId"
              className={estiloSelect}
              disabled={!estabelecimentoId}
              {...register('setorId')}
            >
              <option value="">Não se aplica</option>
              {setor.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            {mensagem('setorId')}
          </div>
          <div>
            <Label htmlFor="funcaoId">Função</Label>
            <select
              id="funcaoId"
              className={estiloSelect}
              {...register('funcaoId')}
            >
              <option value="">Não se aplica</option>
              {opcoes.funcoes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            {mensagem('funcaoId')}
          </div>
          <div>
            <Label htmlFor="turnoId">Turno</Label>
            <select
              id="turnoId"
              className={estiloSelect}
              {...register('turnoId')}
            >
              <option value="">Não se aplica</option>
              {opcoes.turnos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            {mensagem('turnoId')}
          </div>
        </div>
      </fieldset>
      <p className="text-sm leading-6 text-slate-600">
        Este cadastro administra o acesso ao sistema. Ele não identifica
        respostas aos questionários anônimos.
      </p>
      {erro && <MensagemDeErro mensagem={erro} />}
      {sucesso && (
        <p
          role="status"
          className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900"
        >
          {sucesso}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="h-10 px-5">
        {isSubmitting
          ? 'Salvando...'
          : modo === 'novo'
            ? 'Cadastrar usuário'
            : 'Vincular usuário'}
      </Button>
    </form>
  );
}
