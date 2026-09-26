'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MensagemDeErro } from '@/components/mensagem-de-erro';
import { consultarSaude } from '@/lib/consultar-saude';

type EstadoDaConexao = 'carregando' | 'conectada' | 'indisponivel';
const apresentacaoPorEstado = {
  carregando: { texto: 'Verificando conexão...', icone: LoaderCircle, cor: 'text-slate-600' },
  conectada: { texto: 'API conectada', icone: CheckCircle2, cor: 'text-teal-800' },
  indisponivel: { texto: 'API indisponível', icone: WifiOff, cor: 'text-red-700' },
};

export function EstadoDaApi() {
  const [estado, definirEstado] = useState<EstadoDaConexao>('carregando');
  const [tentativa, definirTentativa] = useState(0);
  useEffect(() => {
    const controlador = new AbortController();
    consultarSaude(controlador.signal).then(
      () => { if (!controlador.signal.aborted) definirEstado('conectada'); },
      () => { if (!controlador.signal.aborted) definirEstado('indisponivel'); },
    );
    return () => controlador.abort();
  }, [tentativa]);

  function verificarNovamente() {
    definirEstado('carregando');
    definirTentativa((anterior) => anterior + 1);
  }

  const { texto, icone: Icone, cor } = apresentacaoPorEstado[estado];
  return (
    <section aria-label="Conexão com a API" className="rounded-2xl border border-slate-200 bg-white/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div role="status" aria-live="polite" className={`flex items-center gap-2 text-sm font-semibold ${cor}`}>
            <Icone className={`size-4 ${estado === 'carregando' ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
            {texto}
          </div>
          <p className="mt-2 text-sm text-slate-500">Disponibilidade do serviço de conexão.</p>
        </div>
        <Button variant="outline" className="h-10 px-4" onClick={verificarNovamente} disabled={estado === 'carregando'}>
          <RefreshCw aria-hidden="true" />Verificar novamente
        </Button>
      </div>
      {estado === 'indisponivel' && <MensagemDeErro mensagem="Não foi possível conectar ao serviço. A página continua disponível; tente novamente em instantes." />}
    </section>
  );
}
