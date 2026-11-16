import { gerarCodigoCupom } from './cupom.js';

describe('gerarCodigoCupom', () => {
  it('gera dois grupos de 4 caracteres sem os que se confundem', () => {
    for (let i = 0; i < 200; i++) {
      const codigo = gerarCodigoCupom();
      expect(codigo).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(codigo).not.toMatch(/[01IOL5S]/);
    }
  });

  it('nao repete codigos', () => {
    const codigos = new Set(
      Array.from({ length: 1000 }, () => gerarCodigoCupom()),
    );
    expect(codigos.size).toBe(1000);
  });
});
