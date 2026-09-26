import Link from 'next/link';
import { AcessoUsuarios } from '@/components/acesso-usuarios';

export default function PaginaUsuarios() {
  return (
    <main className="min-h-screen bg-[#f6f7f3] px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-teal-800">
          ← SistemaNR1
        </Link>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          Usuários e vínculos
        </h1>
        <p className="mt-3 text-slate-600">
          Gerencie o acesso administrativo e a matrícula em cada empresa.
        </p>
        <section
          aria-label="Cadastro de usuários"
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
        >
          <AcessoUsuarios />
        </section>
      </div>
    </main>
  );
}
