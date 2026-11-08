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

export interface Professor {
  id: number;
  usuario: Credenciais;
  instituicao: Instituicao;
  nome: string;
  cpf: string;
  departamento: string;
  saldo: number;
}

/** Linha do extrato (GET /transacoes/extrato); "id" so e unico por "tipo". */
interface Movimentacao {
  id: number;
  /** ISO 8601, em UTC. */
  data: string;
  /** Sempre positiva; o "tipo" diz se entrou ou saiu da conta. */
  quantidade: number;
}

export type ItemDoExtrato =
  | (Movimentacao & { tipo: "ENVIO"; motivo: string; aluno: string | null })
  | (Movimentacao & { tipo: "CREDITO_SEMESTRAL"; semestre: string })
  | (Movimentacao & { tipo: "RECEBIMENTO"; motivo: string; professor: string });

export interface Extrato {
  saldo: number;
  transacoes: ItemDoExtrato[];
}

export const NOME_DO_TIPO: Record<TipoUsuario, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  EMPRESA: "Empresa parceira",
};
