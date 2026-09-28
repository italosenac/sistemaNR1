import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { GestaoCampanhas } from '@/components/gestao-campanhas';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Coleta demonstrativa">
      <AreaAutenticada>
        <GestaoCampanhas />
      </AreaAutenticada>
    </PaginaC0>
  );
}
