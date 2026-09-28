import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { GestaoEstrutura } from '@/components/gestao-estrutura';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Setores">
      <AreaAutenticada>
        <GestaoEstrutura tipo="setores" />
      </AreaAutenticada>
    </PaginaC0>
  );
}
