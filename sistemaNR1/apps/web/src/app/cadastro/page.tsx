import { PaginaC0 } from '@/components/pagina-c0';
import { FormularioAuth } from '@/components/formulario-auth';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Criar conta">
      <FormularioAuth modo="cadastro" />
    </PaginaC0>
  );
}
