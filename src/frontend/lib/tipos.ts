// Formato das respostas da API (src/backend). A senha nunca e devolvida.

export type TipoUsuario = "ALUNO" | "PROFESSOR" | "EMPRESA";

/** Dados do token, devolvidos por GET /auth/me. */
export interface UsuarioLogado {
  id: number;
  login: string;
  tipo: TipoUsuario;
}

export interface Credenciais {
  id: number;
  login: string;
  email: string;
  tipoUsuario: TipoUsuario;
}

export interface Instituicao {
  id: number;
  nome: string;
}

export interface Aluno {
  id: number;
  usuario: Credenciais;
  instituicao: Instituicao;
  nome: string;
  cpf: string;
  rg: string;
  endereco: string;
  curso: string;
  saldo: number;
}

export interface EmpresaParceira {
  id: number;
  usuario: Credenciais;
  nome: string;
  cnpj: string;
}

export const NOME_DO_TIPO: Record<TipoUsuario, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  EMPRESA: "Empresa parceira",
};
