import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { AvaliacaoDemonstrativa } from '@/components/avaliacao-demonstrativa';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Avaliação demonstrativa">
      <AreaAutenticada>
        <AvaliacaoDemonstrativa />
      </AreaAutenticada>
    </PaginaC0>
  );
}
