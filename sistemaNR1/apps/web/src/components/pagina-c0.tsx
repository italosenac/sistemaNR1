import Link from 'next/link';
export function PaginaC0({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f6f7f3] px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-teal-800">
          ← SISNR1
        </Link>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight">{titulo}</h1>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
