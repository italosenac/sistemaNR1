import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let clienteDoNavegador: SupabaseClient | undefined;

export function criarClientePublico() {
  if (typeof window !== 'undefined' && clienteDoNavegador)
    return clienteDoNavegador;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) return null;
  const cliente = createClient(url, chave, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  if (typeof window !== 'undefined') clienteDoNavegador = cliente;
  return cliente;
}
