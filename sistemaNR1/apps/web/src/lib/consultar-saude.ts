import type { RespostaDeSaude } from '@sistemanr1/contratos';
import { z } from 'zod';

const esquemaDeSaude = z.object({
  status: z.literal('ok'),
  servico: z.literal('sistemaNR1-api'),
});
const TEMPO_LIMITE_MS = 5_000;

export async function consultarSaude(sinal: AbortSignal): Promise<RespostaDeSaude> {
  const endereco = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resposta = await fetch(`${endereco.replace(/\/$/, '')}/health`, {
    signal: AbortSignal.any([sinal, AbortSignal.timeout(TEMPO_LIMITE_MS)]),
    cache: 'no-store',
    credentials: 'omit',
  });
  if (!resposta.ok) throw new Error('Serviço indisponível.');
  return esquemaDeSaude.parse(await resposta.json());
}
