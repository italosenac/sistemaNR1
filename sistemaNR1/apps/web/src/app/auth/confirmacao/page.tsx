import { PaginaC0 } from '@/components/pagina-c0';
import { ConfirmacaoAuth } from '@/components/confirmacao-auth';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Confirmação da conta">
      <ConfirmacaoAuth />
    </PaginaC0>
  );
}
