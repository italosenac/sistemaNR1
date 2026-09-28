import {
  capacidadesDosPapeis,
  normalizarMatricula,
  validarCnpj,
  validarGrupo,
  validarTurno,
} from '../src/dominio/organizacao.js';

describe('E1 — capacidades e estrutura organizacional', () => {
  it('consultoria isolada não recebe gestão nem consulta técnica', () => {
    expect(capacidadesDosPapeis(['consultoria'])).toEqual([
      'empresa:ler',
      'carteira:ler',
    ]);
  });
  it('papéis combinados unem capacidades explícitas sem privilégios globais', () => {
    const capacidades = capacidadesDosPapeis([
      'consultoria',
      'responsavel_tecnico',
    ]);
    expect(capacidades).toContain('estrutura:ler');
    expect(capacidades).not.toContain('usuarios:gerenciar');
    expect(capacidadesDosPapeis(['trabalhador'])).toEqual([]);
  });
  it('gestão inclui administração apenas no contexto autorizado', () => {
    expect(capacidadesDosPapeis(['gestor_sst_rh'])).toContain(
      'usuarios:gerenciar',
    );
  });
  it('matrícula é opcional e mantém zeros', () => {
    expect(normalizarMatricula('  ')).toBeNull();
    expect(normalizarMatricula(undefined)).toBeNull();
    expect(normalizarMatricula(' 001 ')).toBe('001');
    expect(() => normalizarMatricula('x'.repeat(51))).toThrow();
  });
  it('valida os dois dígitos do CNPJ numérico e alfanumérico', () => {
    expect(validarCnpj('12.ABC.345/01DE-35')).toBe('12ABC34501DE35');
    expect(validarCnpj('11.222.333/0001-81')).toBe('11222333000181');
    expect(validarCnpj('')).toBeNull();
    for (const invalido of [
      '11222333000182',
      '00000000000000',
      '123',
      '12.ABC.345/01DE-34',
    ]) {
      expect(() => validarCnpj(invalido)).toThrow();
    }
  });
  it('aceita turno noturno, mas não horário isolado ou inválido', () => {
    expect(() => validarTurno('22:00', '06:00')).not.toThrow();
    expect(() => validarTurno(null, null)).not.toThrow();
    expect(() => validarTurno('22:00', null)).toThrow();
    expect(() => validarTurno('25:00', '06:00')).toThrow();
  });
  it('rejeita população não positiva e folhas que se sobrepõem', () => {
    const grupo = {
      setorId: 'setor',
      funcaoId: null,
      turnoId: null,
      quantidadeEstimadaTrabalhadores: 8,
    };
    expect(() => validarGrupo(grupo, [])).not.toThrow();
    expect(() =>
      validarGrupo({ ...grupo, quantidadeEstimadaTrabalhadores: 0 }, []),
    ).toThrow();
    expect(() =>
      validarGrupo({ ...grupo, funcaoId: 'funcao' }, [grupo]),
    ).toThrow();
    expect(() =>
      validarGrupo({ ...grupo, funcaoId: 'outra' }, [
        { ...grupo, funcaoId: 'funcao' },
      ]),
    ).not.toThrow();
  });
});
