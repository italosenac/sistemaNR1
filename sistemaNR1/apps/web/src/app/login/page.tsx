import { PaginaC0 } from '@/components/pagina-c0';
import { FormularioAuth } from '@/components/formulario-auth';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Entrar">
      <FormularioAuth modo="login" />
    </PaginaC0>
  );
}
