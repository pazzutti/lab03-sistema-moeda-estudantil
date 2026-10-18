import { cnpjValido } from './cnpj.js';

describe('cnpjValido', () => {
  it('aceita CNPJ com digitos verificadores corretos', () => {
    expect(cnpjValido('11222333000181')).toBe(true);
    expect(cnpjValido('11444777000161')).toBe(true);
  });

  it('rejeita digito verificador errado', () => {
    expect(cnpjValido('11222333000182')).toBe(false);
  });

  it('rejeita tamanho errado, mascara e digitos repetidos', () => {
    expect(cnpjValido('1122233300018')).toBe(false);
    expect(cnpjValido('11.222.333/0001-81')).toBe(false);
    expect(cnpjValido('11111111111111')).toBe(false);
  });
});
