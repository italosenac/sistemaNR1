import Link from 'next/link';
export function PaginaC0({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← SISNR1
        </Link>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
          {titulo}
        </h1>
        <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_3px_#1118270f] sm:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}
