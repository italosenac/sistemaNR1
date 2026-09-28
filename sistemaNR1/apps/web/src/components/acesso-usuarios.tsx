'use client';
import type { CadastroUsuario, VincularUsuario } from '@sistemanr1/contratos';
import { AreaAutenticada } from './area-autenticada';
import { useSessao } from './sessao-provider';
import { FormularioUsuario } from './formulario-usuario';
import { MensagemDeErro } from './mensagem-de-erro';
import { consultarApi, esquemaOpcoes, esquemaVinculo } from '@/lib/usuarios';
import { useConsultaC0 } from '@/lib/use-consulta-c0';
function CadastroAutorizado() {
  const { empresa, obterToken } = useSessao();
  const autorizado = empresa?.capacidades.includes('usuarios:gerenciar');
  const consulta = useConsultaC0(
    autorizado ? `/empresas/${empresa!.id}/usuarios/opcoes` : null,
    esquemaOpcoes,
  );
  async function salvar(entrada: CadastroUsuario | VincularUsuario) {
    const destino = 'usuarioId' in entrada ? 'vinculos' : 'usuarios';
    await consultarApi(
      `/empresas/${empresa!.id}/${destino}`,
      await obterToken(),
      esquemaVinculo,
      { corpo: entrada },
    );
  }
  if (!autorizado)
    return (
      <p role="status">
        Sua conta não possui vínculo de gestão ativo nesta empresa.
      </p>
    );
  if (consulta.erro) return <MensagemDeErro mensagem={consulta.erro} />;
  if (!consulta.dados)
    return <p role="status">Carregando opções da empresa...</p>;
  return (
    <FormularioUsuario
      key={empresa!.id}
      opcoes={consulta.dados}
      aoSalvar={salvar}
    />
  );
}
export function AcessoUsuarios() {
  return (
    <AreaAutenticada>
      <CadastroAutorizado />
    </AreaAutenticada>
  );
}
