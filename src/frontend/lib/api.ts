// Comunicacao com o backend NestJS. O token JWT vai no header Authorization.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Erro devolvido pela API. "campos" associa a mensagem ao campo do
 * formulario (400 de validacao e 409 de dado duplicado).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly campos: Record<string, string> = {},
  ) {
    super(message);
  }
}

interface Opcoes {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function requisitar<T>(
  caminho: string,
  { method = "GET", body, token }: Opcoes = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let resposta: Response;
  try {
    resposta = await fetch(API_URL + caminho, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
    );
  }

  if (resposta.status === 204) {
    return undefined as T;
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagem = dados?.message ?? `Erro ${resposta.status}`;
    throw new ApiError(
      resposta.status,
      Array.isArray(mensagem) ? mensagem.join(" ") : mensagem,
      dados?.campos,
    );
  }
  return dados as T;
}
