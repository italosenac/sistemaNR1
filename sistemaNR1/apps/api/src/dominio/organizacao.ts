import type { Capacidade, PapelUsuario } from '@sistemanr1/contratos';
import { ErroDeUsuario } from './usuario.js';

const CAPACIDADES: Record<PapelUsuario, readonly Capacidade[]> = {
  trabalhador: [],
  gestor_sst_rh: [
    'empresa:ler',
    'empresa:editar',
    'estrutura:ler',
    'estrutura:gerenciar',
    'usuarios:gerenciar',
  ],
  responsavel_tecnico: ['empresa:ler', 'estrutura:ler'],
  consultoria: ['empresa:ler', 'carteira:ler'],
};
export function capacidadesDosPapeis(
  papeis: readonly PapelUsuario[],
): Capacidade[] {
  return [...new Set(papeis.flatMap((papel) => CAPACIDADES[papel] ?? []))];
}
export function normalizarMatricula(valor?: string | null): string | null {
  const matricula = valor?.trim() || null;
  if (matricula && matricula.length > 50)
    throw new ErroDeUsuario(
      'DADOS_INVALIDOS',
      'A matrícula deve ter até 50 caracteres.',
    );
  return matricula;
}
export function validarCnpj(valor?: string | null): string | null {
  if (!valor?.trim()) return null;
  const cnpj = valor.trim().toUpperCase().replace(/[./-]/g, '');
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj))
    throw new ErroDeUsuario('DADOS_INVALIDOS', 'Informe um CNPJ válido.');
  const digito = (base: string): string => {
    const soma = [...base]
      .reverse()
      .reduce(
        (total, caractere, indice) =>
          total + (caractere.charCodeAt(0) - 48) * (2 + (indice % 8)),
        0,
      );
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const base = cnpj.slice(0, 12);
  const primeiro = digito(base);
  if (cnpj !== base + primeiro + digito(base + primeiro))
    throw new ErroDeUsuario(
      'DADOS_INVALIDOS',
      'Os dígitos verificadores do CNPJ são inválidos.',
    );
  return cnpj;
}
export function validarTurno(
  inicio?: string | null,
  fim?: string | null,
): void {
  if (!inicio && !fim) return;
  if (
    !inicio ||
    !fim ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(inicio) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(fim)
  )
    throw new ErroDeUsuario(
      'DADOS_INVALIDOS',
      'Informe os dois horários no formato HH:mm.',
    );
}
interface FolhaPopulacao {
  setorId?: string | null;
  funcaoId?: string | null;
  turnoId?: string | null;
  quantidadeEstimadaTrabalhadores?: number;
}
export function validarGrupo(
  grupo: FolhaPopulacao,
  existentes: readonly FolhaPopulacao[],
): void {
  if (
    !grupo.setorId ||
    !Number.isInteger(grupo.quantidadeEstimadaTrabalhadores) ||
    (grupo.quantidadeEstimadaTrabalhadores ?? 0) <= 0
  )
    throw new ErroDeUsuario(
      'DADOS_INVALIDOS',
      'Informe setor e população inteira positiva.',
    );
  const sobreposto = existentes.some(
    (outro) =>
      outro.setorId === grupo.setorId &&
      (!outro.funcaoId ||
        !grupo.funcaoId ||
        outro.funcaoId === grupo.funcaoId) &&
      (!outro.turnoId || !grupo.turnoId || outro.turnoId === grupo.turnoId),
  );
  if (sobreposto)
    throw new ErroDeUsuario(
      'CONFLITO',
      'Este grupo sobrepõe outra população ativa do setor.',
    );
}
