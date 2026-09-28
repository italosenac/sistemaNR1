import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { PainelC0 } from '@/components/painel-c0';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Painel">
      <AreaAutenticada>
        <PainelC0 />
      </AreaAutenticada>
    </PaginaC0>
  );
}
