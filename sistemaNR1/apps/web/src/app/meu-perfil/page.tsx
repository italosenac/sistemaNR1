import { PaginaC0 } from '@/components/pagina-c0';
import { AreaAutenticada } from '@/components/area-autenticada';
import { MeuPerfil } from '@/components/meu-perfil';
export default function Pagina() {
  return (
    <PaginaC0 titulo="Meu perfil">
      <AreaAutenticada>
        <MeuPerfil />
      </AreaAutenticada>
    </PaginaC0>
  );
}
