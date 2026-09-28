import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { MeusVinculos } from '@/components/meu-perfil';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Meus vínculos">
      <AreaAutenticada>
        <MeusVinculos />
      </AreaAutenticada>
    </PaginaC0>
  );
}
