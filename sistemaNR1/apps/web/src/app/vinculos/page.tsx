import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { GestaoVinculos } from '@/components/gestao-vinculos';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Vínculos e matrículas">
      <AreaAutenticada>
        <GestaoVinculos />
      </AreaAutenticada>
    </PaginaC0>
  );
}
