import { cpfValido } from './cpf.js';

describe('cpfValido', () => {
  it('aceita CPF com digitos verificadores corretos', () => {
    expect(cpfValido('52998224725')).toBe(true);
    expect(cpfValido('11144477735')).toBe(true);
  });

  it('rejeita digito verificador errado', () => {
    expect(cpfValido('52998224724')).toBe(false);
  });

  it('rejeita tamanho errado, mascara e digitos repetidos', () => {
    expect(cpfValido('5299822472')).toBe(false);
    expect(cpfValido('529.982.247-25')).toBe(false);
    expect(cpfValido('11111111111')).toBe(false);
  });
});
