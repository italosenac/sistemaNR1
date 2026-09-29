'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSessao } from './sessao-provider';
import { MensagemDeErro } from './mensagem-de-erro';
export function ConfirmacaoAuth() {
  const { cliente, sessao } = useSessao();
  const [erro, setErro] = useState('');
  useEffect(() => {
    async function confirmar() {
      const url = new URL(window.location.href);
      const hash = url.searchParams.get('token_hash');
      const tipo = url.searchParams.get('type');
      if (url.searchParams.has('error') || url.hash.includes('error=')) {
        window.history.replaceState(null, '', url.pathname);
        setErro('O link é inválido ou expirou. Solicite uma nova confirmação.');
        return;
      }
      if (
        !hash &&
        !url.searchParams.has('code') &&
        !url.hash.includes('access_token=')
      ) {
        setErro(
          sessao ? '' : 'Abra o link de confirmação recebido por e-mail.',
        );
        return;
      }
      if (hash && cliente) {
        window.history.replaceState(null, '', url.pathname);
        if (tipo !== 'signup' && tipo !== 'email' && tipo !== 'recovery') {
          setErro('Tipo de confirmação inválido.');
          return;
        }
        try {
          const { error } = await cliente.auth.verifyOtp({
            token_hash: hash,
            type: tipo,
          });
          if (error)
            setErro(
              'O link é inválido ou expirou. Solicite uma nova confirmação.',
            );
        } catch {
          setErro('Não foi possível verificar o link.');
        }
      }
    }
    void confirmar();
  }, [cliente, sessao]);
  return (
    <div className="space-y-4">
      {erro ? (
        <MensagemDeErro mensagem={erro} />
      ) : (
        <p role="status">
          {sessao
            ? 'Identidade confirmada. Você pode continuar.'
            : 'Verificando o link de confirmação...'}
        </p>
      )}
      <Link
        href={sessao ? '/dashboard' : '/login'}
        className="text-teal-800 underline"
      >
        {sessao ? 'Acessar painel' : 'Ir para login'}
      </Link>
    </div>
  );
}
