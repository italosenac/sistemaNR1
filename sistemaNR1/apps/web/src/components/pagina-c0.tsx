import Link from 'next/link';
export function PaginaC0({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          ← SISNR1
        </Link>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight">{titulo}</h1>
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_#1118270f] sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
