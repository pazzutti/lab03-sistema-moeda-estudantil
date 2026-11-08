import { semestreAtual, semestreDaRecarga } from './semestre.js';

describe('semestreDaRecarga', () => {
  it('recarrega na primeira semana de fevereiro e de agosto', () => {
    expect(semestreDaRecarga(new Date(2027, 1, 1))).toBe('2027.1');
    expect(semestreDaRecarga(new Date(2027, 1, 7))).toBe('2027.1');
    expect(semestreDaRecarga(new Date(2027, 7, 1))).toBe('2027.2');
    expect(semestreDaRecarga(new Date(2027, 7, 7))).toBe('2027.2');
  });

  it('nao recarrega fora da primeira semana ou em outros meses', () => {
    expect(semestreDaRecarga(new Date(2027, 1, 8))).toBeNull();
    expect(semestreDaRecarga(new Date(2027, 7, 8))).toBeNull();
    expect(semestreDaRecarga(new Date(2027, 2, 3))).toBeNull();
  });
});

describe('semestreAtual', () => {
  it('considera janeiro parte do segundo semestre do ano anterior', () => {
    expect(semestreAtual(new Date(2027, 0, 15))).toBe('2026.2');
  });

  it('separa os semestres em fevereiro e agosto', () => {
    expect(semestreAtual(new Date(2027, 1, 1))).toBe('2027.1');
    expect(semestreAtual(new Date(2027, 6, 31))).toBe('2027.1');
    expect(semestreAtual(new Date(2027, 7, 1))).toBe('2027.2');
  });
});
