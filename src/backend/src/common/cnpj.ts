import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions } from 'class-validator';

/** Valida os dois digitos verificadores de um CNPJ com 14 digitos. */
export function cnpjValido(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }
  const digito = (tamanho: number) => {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cnpj[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(12) === Number(cnpj[12]) && digito(13) === Number(cnpj[13]);
}

/**
 * Aceita CNPJ com ou sem mascara ("11.222.333/0001-81" ou "11222333000181")
 * e o normaliza para apenas digitos antes de validar e gravar.
 */
export function IsCnpj(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) => {
    Transform(({ value }) =>
      typeof value === 'string' ? value.replace(/\D/g, '') : value,
    )(target, propertyKey);
    registerDecorator({
      name: 'isCnpj',
      target: target.constructor,
      propertyName: propertyKey as string,
      options: { message: 'CNPJ inválido: confira os dígitos.', ...options },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && cnpjValido(value),
      },
    });
  };
}
