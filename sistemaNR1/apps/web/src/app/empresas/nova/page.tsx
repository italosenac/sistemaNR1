import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { FormularioEmpresa } from '@/components/formulario-empresa';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Cadastrar empresa">
      <AreaAutenticada>
        <FormularioEmpresa />
      </AreaAutenticada>
    </PaginaC0>
  );
}
