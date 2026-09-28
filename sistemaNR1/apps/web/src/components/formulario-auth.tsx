'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessao } from './sessao-provider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';
export function FormularioAuth({
  modo = 'login',
}: {
  modo?: 'login' | 'cadastro' | 'recuperacao' | 'nova-senha' | 'reenviar';
}) {
  const { cliente, sessao } = useSessao();
  const router = useRouter();
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  const titulo = {
    login: 'Entrar',
    cadastro: 'Criar conta',
    recuperacao: 'Recuperar senha',
    'nova-senha': 'Salvar nova senha',
    reenviar: 'Reenviar confirmação',
  }[modo];
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!cliente) return;
    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    const email = String(dados.get('email') ?? '').trim();
    const senha = String(dados.get('senha') ?? '');
    const nome = String(dados.get('nomeCompleto') ?? '').trim();
    definirErro('');
    definirSucesso('');
    definirOcupado(true);
    try {
      if (modo === 'cadastro' && (nome.length < 3 || nome.length > 150))
        throw new Error('Informe o nome completo, de 3 a 150 caracteres.');
      if (
        ['cadastro', 'nova-senha'].includes(modo) &&
        (senha.length < 12 ||
          senha.length > 128 ||
          senha !== dados.get('confirmarSenha'))
      )
        throw new Error(
          'Use uma senha de 12 a 128 caracteres e confirme o mesmo valor.',
        );
      const retorno = window.location.origin + '/auth/confirmacao';
      if (modo === 'login') {
        const { error } = await cliente.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error)
          throw new Error(
            'Não foi possível entrar. Confira e-mail, senha e confirmação da conta.',
          );
      } else if (modo === 'cadastro') {
        const { data, error } = await cliente.auth.signUp({
          email,
          password: senha,
          options: { data: { nome_completo: nome }, emailRedirectTo: retorno },
        });
        if (error)
          throw new Error(
            'Não foi possível cadastrar. Confira os dados e tente novamente mais tarde.',
          );
        definirSucesso(
          data.session
            ? 'Conta criada. Acesse o painel para continuar.'
            : 'Se o cadastro puder prosseguir, você receberá um e-mail de confirmação. Confira sua caixa de entrada.',
        );
      } else if (modo === 'recuperacao') {
        const { error } = await cliente.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/atualizar-senha',
        });
        if (error)
          throw new Error(
            'Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.',
          );
        definirSucesso(
          'Se existir uma conta para este e-mail, você receberá instruções para recuperar a senha.',
        );
      } else if (modo === 'reenviar') {
        const { error } = await cliente.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: retorno },
        });
        if (error)
          throw new Error('Não foi possível solicitar a confirmação agora.');
        definirSucesso(
          'Se houver confirmação pendente, as instruções serão enviadas ao e-mail informado.',
        );
      } else {
        if (!sessao)
          throw new Error('Abra o link de recuperação recebido por e-mail.');
        const { error } = await cliente.auth.updateUser({ password: senha });
        if (error)
          throw new Error(
            'Não foi possível atualizar a senha. Solicite um novo link de recuperação.',
          );
        definirSucesso('Senha atualizada. Você já pode acessar o painel.');
      }
      if (modo === 'login' && window.location.pathname === '/login')
        router.push('/dashboard');
    } catch (e) {
      definirErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível concluir a autenticação.',
      );
    } finally {
      formulario
        .querySelectorAll<HTMLInputElement>('input[type=password]')
        .forEach((c) => {
          c.value = '';
        });
      definirOcupado(false);
    }
  }
  if (cliente === undefined)
    return <p role="status">Preparando autenticação...</p>;
  if (!cliente)
    return (
      <MensagemDeErro mensagem="A autenticação ainda não está configurada neste ambiente." />
    );
  return (
    <div className="mx-auto max-w-md space-y-5">
      <form onSubmit={enviar} className="space-y-5">
        {modo === 'cadastro' && (
          <div>
            <Label htmlFor="auth-nome">Nome completo</Label>
            <Input
              id="auth-nome"
              name="nomeCompleto"
              minLength={3}
              maxLength={150}
              required
              autoComplete="name"
            />
          </div>
        )}
        {modo !== 'nova-senha' && (
          <div>
            <Label htmlFor="auth-email">E-mail</Label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              maxLength={254}
              required
              autoComplete="email"
            />
          </div>
        )}
        {['login', 'cadastro', 'nova-senha'].includes(modo) && (
          <div>
            <Label htmlFor="auth-senha">Senha</Label>
            <Input
              id="auth-senha"
              name="senha"
              type="password"
              required
              maxLength={128}
              minLength={modo === 'login' ? 1 : 12}
              autoComplete={
                modo === 'login' ? 'current-password' : 'new-password'
              }
            />
          </div>
        )}
        {['cadastro', 'nova-senha'].includes(modo) && (
          <div>
            <Label htmlFor="auth-confirmar">Confirmar senha</Label>
            <Input
              id="auth-confirmar"
              name="confirmarSenha"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>
        )}
        <Button type="submit" disabled={ocupado} className="w-full sm:w-auto">
          {ocupado ? 'Aguarde...' : titulo}
        </Button>
      </form>
      {erro && <MensagemDeErro mensagem={erro} />}
      {sucesso && (
        <p
          role="status"
          className="rounded-lg bg-[var(--color-bg-success)] p-3 text-[var(--color-text-success)]"
        >
          {sucesso}
        </p>
      )}
      <nav
        aria-label="Acesso à conta"
        className="flex flex-wrap gap-4 text-sm text-[var(--color-text-brand)] underline underline-offset-4"
      >
        {modo !== 'login' && <Link href="/login">Entrar</Link>}
        {modo !== 'cadastro' && <Link href="/cadastro">Criar conta</Link>}
        {modo !== 'recuperacao' && (
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
        )}
        <Link href="/confirmar-email">Confirmar e-mail</Link>
        {sessao && <Link href="/dashboard">Acessar painel</Link>}
      </nav>
    </div>
  );
}
