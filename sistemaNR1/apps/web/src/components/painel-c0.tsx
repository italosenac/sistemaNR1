'use client';
import Link from 'next/link';
import { useSessao } from './sessao-provider';
export function PainelC0() {
  const { empresas, empresa } = useSessao();
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Seu espaço de trabalho</h2>
      <p>
        {empresa
          ? `Empresa selecionada: ${empresa.nome}`
          : 'Sua conta está pronta. Crie uma empresa ou solicite uma associação ao gestor.'}
      </p>
      <p>{empresas.length} empresa(s) autorizada(s).</p>
      <div className="flex flex-wrap gap-4 text-teal-800 underline">
        <Link href="/meu-perfil">Atualizar meu perfil</Link>
        <Link href="/empresas/nova">Cadastrar empresa</Link>
      </div>
      <p className="text-sm text-slate-600">
        M1 — Coleta, M2 — Avaliação e M3 — Inventário ainda não implementados.
        Use somente dados fictícios.
      </p>
    </div>
  );
}
