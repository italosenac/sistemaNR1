'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MensagemDeErro } from './mensagem-de-erro';

const perguntas = [
  {
    nome: 'sobrecargaPercebida',
    rotulo: 'Como você percebe a carga de trabalho?',
  },
  { nome: 'ritmoPercebido', rotulo: 'Como você percebe o ritmo de trabalho?' },
] as const;

export function QuestionarioAnonimo() {
  const [codigo, definirCodigo] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  const [concluido, definirConcluido] = useState(false);
  const [erro, definirErro] = useState('');

  useEffect(() => {
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    const recebido = fragmento.get('codigo');
    if (recebido && /^[a-f0-9]{64}$/.test(recebido))
      queueMicrotask(() => definirCodigo(recebido));
    if (recebido)
      window.history.replaceState(null, '', window.location.pathname);
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!/^[a-f0-9]{64}$/.test(codigo)) {
      definirErro('Informe um código válido de 64 caracteres.');
      return;
    }
    const campos = new FormData(evento.currentTarget);
    definirOcupado(true);
    definirErro('');
    try {
      const origem = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const resposta = await fetch(
        origem.replace(/\/$/, '') + '/api/v1/questionarios/respostas',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
          cache: 'no-store',
          body: JSON.stringify({
            codigo,
            sobrecargaPercebida: Number(campos.get('sobrecargaPercebida')),
            ritmoPercebido: Number(campos.get('ritmoPercebido')),
          }),
        },
      );
      if (resposta.status !== 202)
        throw new Error('Código indisponível ou coleta fora do período.');
      definirCodigo('');
      definirConcluido(true);
    } catch {
      definirErro(
        'Não foi possível registrar. Confira o código e o período da coleta.',
      );
    } finally {
      definirOcupado(false);
    }
  }

  if (concluido)
    return (
      <div role="status" className="space-y-3">
        <h2 className="text-xl font-semibold">Resposta recebida</h2>
        <p>
          Obrigado por participar. Este código não pode ser usado novamente.
        </p>
      </div>
    );

  return (
    <form
      onSubmit={(evento) => void enviar(evento)}
      className="max-w-2xl space-y-6"
    >
      <p className="text-sm text-muted-foreground">
        Demonstração com dados fictícios. Não informe nome, matrícula, e-mail ou
        outros dados pessoais. A participação usa um código individual do grupo,
        sem login.
      </p>
      <div className="space-y-2">
        <Label htmlFor="codigo-coleta">Código de participação</Label>
        <Input
          id="codigo-coleta"
          value={codigo}
          onChange={(evento) =>
            definirCodigo(evento.target.value.trim().toLowerCase())
          }
          required
          minLength={64}
          maxLength={64}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {perguntas.map((pergunta) => (
        <fieldset
          key={pergunta.nome}
          className="space-y-3 rounded-xl border border-border p-4"
        >
          <legend className="px-1 font-medium">{pergunta.rotulo}</legend>
          <div className="flex flex-wrap gap-5">
            {[
              ['1', 'Baixo'],
              ['2', 'Moderado'],
              ['3', 'Alto'],
            ].map(([valor, rotulo]) => (
              <label key={valor} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={pergunta.nome}
                  value={valor}
                  required
                  className="accent-primary"
                />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {erro && <MensagemDeErro mensagem={erro} />}
      <Button type="submit" disabled={ocupado}>
        {ocupado ? 'Enviando...' : 'Enviar resposta'}
      </Button>
    </form>
  );
}
