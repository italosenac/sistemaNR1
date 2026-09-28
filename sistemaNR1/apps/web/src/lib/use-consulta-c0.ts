'use client';
import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';
import { useSessao } from '@/components/sessao-provider';
import { consultarApi } from './usuarios';
export function useConsultaC0<T>(
  caminho: string | null,
  esquema: z.ZodType<T>,
) {
  const { obterToken } = useSessao();
  const [dados, definirDados] = useState<T | null>(null);
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [revisao, definirRevisao] = useState(0);
  useEffect(() => {
    const cancelar = new AbortController();
    async function carregar() {
      if (!caminho) return;
      definirCarregando(true);
      definirErro('');
      try {
        const token = await obterToken();
        const resultado = await consultarApi(caminho, token, esquema, {
          sinal: cancelar.signal,
        });
        if (!cancelar.signal.aborted) definirDados(resultado);
      } catch (e) {
        if (!cancelar.signal.aborted)
          definirErro(
            e instanceof Error ? e.message : 'Não foi possível consultar.',
          );
      } finally {
        if (!cancelar.signal.aborted) definirCarregando(false);
      }
    }
    void carregar();
    return () => cancelar.abort();
  }, [caminho, esquema, obterToken, revisao]);
  return {
    dados,
    erro,
    carregando,
    atualizar: useCallback(() => definirRevisao((r) => r + 1), []),
  };
}
