import { cnpjValido, cpfValido } from "./documentos";

// Regras de cada campo, espelhando os DTOs do backend. Cada regra devolve a
// mensagem de erro, ou undefined quando o valor e valido.

type Regra = (valor: string) => string | undefined;

export const obrigatorio =
  (mensagem: string): Regra =>
  (valor) =>
    valor.trim() ? undefined : mensagem;

export const email: Regra = (valor) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
    ? undefined
    : "Informe um email válido.";

export const cpf: Regra = (valor) =>
  cpfValido(valor) ? undefined : "CPF inválido: confira os dígitos.";

export const cnpj: Regra = (valor) =>
  cnpjValido(valor) ? undefined : "CNPJ inválido: confira os dígitos.";

export const senha: Regra = (valor) =>
  valor.length >= 6 ? undefined : "A senha deve ter pelo menos 6 caracteres.";

/** Senha opcional na edicao: vazia mantem a atual. */
export const senhaOpcional: Regra = (valor) =>
  valor === "" ? undefined : senha(valor);

export function validar<T extends Record<string, string>>(
  valores: T,
  regras: Partial<Record<keyof T, Regra[]>>,
): Partial<Record<keyof T, string>> {
  const erros: Partial<Record<keyof T, string>> = {};
  for (const campo in regras) {
    for (const regra of regras[campo] ?? []) {
      const erro = regra(valores[campo]);
      if (erro) {
        erros[campo] = erro;
        break;
      }
    }
  }
  return erros;
}
