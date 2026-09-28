'use client';
import Link from 'next/link';
import { useSessao } from './sessao-provider';
import { Button } from './ui/button';
export function ListaEmpresas({
  consultoria = false,
}: {
  consultoria?: boolean;
}) {
  const { empresas, selecionarEmpresa } = useSessao();
  const lista = consultoria
    ? empresas.filter((e) => e.papeis.includes('consultoria'))
    : empresas;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {consultoria ? 'Carteira autorizada' : 'Empresas vinculadas'}
      </h2>
      {lista.length === 0 && (
        <p role="status">Nenhuma empresa autorizada nesta lista.</p>
      )}
      <ul className="space-y-3">
        {lista.map((e) => (
          <li key={e.id} className="rounded-xl border p-4">
            <p className="font-medium">{e.nome}</p>
            <p className="mt-1 text-sm text-slate-600">
              {e.papeis
                .map(
                  (p) =>
                    ({
                      trabalhador: 'Trabalhador',
                      gestor_sst_rh: 'Gestor SST/RH',
                      responsavel_tecnico: 'Responsável técnico',
                      consultoria: 'Consultoria',
                    })[p],
                )
                .join(', ') || 'Sem atribuições'}
            </p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => selecionarEmpresa(e.id)}
            >
              Selecionar {e.nome}
            </Button>
          </li>
        ))}
      </ul>
      <Link href="/empresas/nova" className="text-teal-800 underline">
        Cadastrar nova empresa
      </Link>
    </div>
  );
}
