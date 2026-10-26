"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { ApiError, requisitar } from "@/lib/api";
import { NOME_DO_TIPO, type TipoUsuario, type UsuarioLogado } from "@/lib/tipos";
import { Alerta, Carregando, Cartao } from "./ui";
import { useAvisos } from "./toast";

// A sessao (token + usuario) fica no localStorage. useSyncExternalStore le o
// valor no navegador e devolve null no prerender do servidor.

const CHAVE_SESSAO = "sessao";
const CHAVE_DESTINO = "destino";

interface Sessao {
  token: string;
  usuario: UsuarioLogado;
}

const ouvintes = new Set<() => void>();

function lerSessao(): string | null {
  try {
    return localStorage.getItem(CHAVE_SESSAO);
  } catch {
    return null;
  }
}

function gravarSessao(sessao: Sessao | null) {
  try {
    if (sessao) {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    } else {
      localStorage.removeItem(CHAVE_SESSAO);
    }
  } catch {
    // Navegacao privada sem storage: a sessao dura so ate recarregar.
  }
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  // Login/logout em outra aba tambem atualiza esta.
  window.addEventListener("storage", ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", ouvinte);
  };
}

const assinarNada = () => () => {};

/** Saida pelo botao "Sair" ou exclusao da conta: nao volta para o login. */
let saidaVoluntaria = false;

export type StatusSessao = "carregando" | "anonimo" | "autenticado";

interface Auth {
  status: StatusSessao;
  usuario: UsuarioLogado | null;
  entrar: (login: string, senha: string) => Promise<UsuarioLogado>;
  /** Com "para", e uma saida voluntaria; com "motivo", mostra o aviso. */
  sair: (opcoes?: { motivo?: string; para?: string }) => void;
  /** requisitar() com o token; um 401 encerra a sessao. */
  api: <T>(
    caminho: string,
    opcoes?: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown },
  ) => Promise<T>;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const avisos = useAvisos();
  const router = useRouter();
  const hidratado = useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  );
  const bruto = useSyncExternalStore(assinar, lerSessao, () => null);
  const sessao = useMemo<Sessao | null>(() => {
    try {
      return bruto ? JSON.parse(bruto) : null;
    } catch {
      return null;
    }
  }, [bruto]);

  const sair = useCallback<Auth["sair"]>(
    ({ motivo, para } = {}) => {
      if (para) {
        saidaVoluntaria = true;
        router.replace(para);
      }
      gravarSessao(null);
      if (motivo) avisos.erro(motivo);
    },
    [avisos, router],
  );

  const api = useCallback<Auth["api"]>(
    async (caminho, opcoes) => {
      try {
        return await requisitar(caminho, { ...opcoes, token: sessao?.token });
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 401 && sessao) {
          sair({ motivo: "Sua sessão expirou. Entre novamente." });
        }
        throw erro;
      }
    },
    [sessao, sair],
  );

  const entrar = useCallback(async (login: string, senha: string) => {
    const { accessToken } = await requisitar<{ accessToken: string }>(
      "/auth/login",
      { method: "POST", body: { login, senha } },
    );
    const usuario = await requisitar<UsuarioLogado>("/auth/me", {
      token: accessToken,
    });
    saidaVoluntaria = false;
    gravarSessao({ token: accessToken, usuario });
    return usuario;
  }, []);

  // Confere se o token salvo ainda vale ao abrir o sistema.
  const token = sessao?.token;
  useEffect(() => {
    if (!token) return;
    requisitar("/auth/me", { token }).catch((erro) => {
      if (erro instanceof ApiError && erro.status === 401) {
        sair({ motivo: "Sua sessão expirou. Entre novamente." });
      }
    });
  }, [token, sair]);

  const valor = useMemo<Auth>(
    () => ({
      status: !hidratado ? "carregando" : sessao ? "autenticado" : "anonimo",
      usuario: sessao?.usuario ?? null,
      entrar,
      sair,
      api,
    }),
    [hidratado, sessao, entrar, sair, api],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return auth;
}

/** Pagina a abrir depois do login (a que o usuario tentou acessar). */
export function consumirDestino(): string {
  try {
    const destino = sessionStorage.getItem(CHAVE_DESTINO);
    sessionStorage.removeItem(CHAVE_DESTINO);
    return destino ?? "/painel";
  } catch {
    return "/painel";
  }
}

/**
 * Area logada: sem sessao, guarda a pagina pedida e manda para o login.
 * Com "tipos", tambem bloqueia perfis sem permissao para a pagina.
 */
export function ExigirLogin({
  children,
  tipos,
}: {
  children: React.ReactNode;
  tipos?: TipoUsuario[];
}) {
  const { status, usuario } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonimo" && !saidaVoluntaria) {
      try {
        sessionStorage.setItem(CHAVE_DESTINO, window.location.pathname);
      } catch {}
      router.replace("/login");
    }
  }, [status, router]);

  // A pagina e sempre renderizada (o Next precisa dela no prerender), mas
  // fica escondida ate a sessao ser confirmada no navegador.
  if (status !== "autenticado" || !usuario) {
    return (
      <>
        <Carregando texto="Verificando sua sessão..." />
        <div hidden>{children}</div>
      </>
    );
  }
  if (tipos && !tipos.includes(usuario.tipo)) {
    return (
      <Cartao titulo="Acesso restrito" className="mx-auto w-full max-w-lg">
        <Alerta>
          Esta página está disponível apenas para{" "}
          {tipos.map((t) => NOME_DO_TIPO[t].toLowerCase()).join(" e ")}. Você
          entrou como {NOME_DO_TIPO[usuario.tipo].toLowerCase()}.
        </Alerta>
      </Cartao>
    );
  }
  return children;
}

/** Login e cadastros: quem ja entrou vai direto para o painel. */
export function SomenteAnonimo({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "autenticado") {
      router.replace(consumirDestino());
    }
  }, [status, router]);

  if (status !== "anonimo") {
    return (
      <>
        <Carregando />
        <div hidden>{children}</div>
      </>
    );
  }
  return children;
}
