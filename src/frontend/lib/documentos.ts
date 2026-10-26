// CPF e CNPJ: mesma regra de digitos verificadores do backend
// (src/backend/src/common), para avisar o erro antes de enviar.

export const apenasDigitos = (texto: string) => texto.replace(/\D/g, "");

export function cpfValido(valor: string): boolean {
  const cpf = apenasDigitos(valor);
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

export function cnpjValido(valor: string): boolean {
  const cnpj = apenasDigitos(valor);
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

/** Aplica a mascara enquanto o usuario digita: 000.000.000-00 */
export function mascararCpf(valor: string): string {
  return apenasDigitos(valor)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Aplica a mascara enquanto o usuario digita: 00.000.000/0000-00 */
export function mascararCnpj(valor: string): string {
  return apenasDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Mostra so os digitos centrais, para quem nao e o dono do cadastro. */
export function ocultarCpf(cpf: string): string {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

/** Formata o valor gravado (so digitos) para exibicao. */
export const formatarCpf = mascararCpf;
export const formatarCnpj = mascararCnpj;
