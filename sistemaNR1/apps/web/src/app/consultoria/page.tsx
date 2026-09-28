import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { ListaEmpresas } from '@/components/lista-empresas';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Carteira da consultoria">
      <AreaAutenticada>
        <ListaEmpresas consultoria />
      </AreaAutenticada>
    </PaginaC0>
  );
}
