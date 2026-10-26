import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions } from 'class-validator';

/** Valida os dois digitos verificadores de um CPF com 11 digitos. */
export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  const digito = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

/**
 * Aceita CPF com ou sem mascara ("123.456.789-09" ou "12345678909") e o
 * normaliza para apenas digitos antes de validar e gravar.
 */
export function IsCpf(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) => {
    Transform(({ value }) =>
      typeof value === 'string' ? value.replace(/\D/g, '') : value,
    )(target, propertyKey);
    registerDecorator({
      name: 'isCpf',
      target: target.constructor,
      propertyName: propertyKey as string,
      options: { message: 'CPF inválido: confira os dígitos.', ...options },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && cpfValido(value),
      },
    });
  };
}
