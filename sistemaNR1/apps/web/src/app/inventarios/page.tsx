import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { InventarioIntegrado } from '@/components/inventario-integrado';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Inventário geral integrado">
      <AreaAutenticada>
        <InventarioIntegrado />
      </AreaAutenticada>
    </PaginaC0>
  );
}
