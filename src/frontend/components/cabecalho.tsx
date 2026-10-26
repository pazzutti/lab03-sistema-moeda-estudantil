"use client";

import { Coins, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NOME_DO_TIPO, type TipoUsuario } from "@/lib/tipos";
import { useAuth } from "./auth";

interface ItemMenu {
  href: string;
  rotulo: string;
  /** Perfis que veem o item; sem a lista, todos os logados veem. */
  tipos?: TipoUsuario[];
}

const MENU_LOGADO: ItemMenu[] = [
  { href: "/painel", rotulo: "Painel" },
  { href: "/alunos", rotulo: "Alunos" },
  { href: "/empresas", rotulo: "Empresas parceiras" },
  { href: "/perfil", rotulo: "Meu perfil", tipos: ["ALUNO", "EMPRESA"] },
];

const MENU_ANONIMO: ItemMenu[] = [
  { href: "/cadastro/aluno", rotulo: "Sou aluno" },
  { href: "/cadastro/empresa", rotulo: "Sou empresa" },
];

export function Cabecalho() {
  const { status, usuario, sair } = useAuth();
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);

  const itens =
    status === "autenticado" && usuario
      ? MENU_LOGADO.filter((i) => !i.tipos || i.tipos.includes(usuario.tipo))
      : MENU_ANONIMO;

  const link = (item: ItemMenu) => {
    const ativo = caminho === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setAberto(false)}
        aria-current={ativo ? "page" : undefined}
        className={`rounded-md px-3 py-2 text-sm font-medium transition ${
          ativo
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {item.rotulo}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link
          href={status === "autenticado" ? "/painel" : "/"}
          className="flex items-center gap-2 font-semibold text-slate-900"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <Coins className="size-4" />
          </span>
          Moeda Estudantil
        </Link>

        {status !== "carregando" && (
          <>
            <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
              {itens.map(link)}
            </nav>

            <div className="ml-auto hidden items-center gap-3 md:flex">
              {usuario ? (
                <>
                  <div className="text-right leading-tight">
                    <p className="text-sm font-medium text-slate-900">
                      {usuario.login}
                    </p>
                    <p className="text-xs text-slate-500">
                      {NOME_DO_TIPO[usuario.tipo]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => sair({ para: "/" })}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    <LogOut className="size-4" />
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Entrar
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAberto(!aberto)}
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={aberto}
              className="ml-auto rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </>
        )}
      </div>

      {aberto && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 md:hidden">
          {usuario && (
            <p className="px-3 pb-2 text-xs text-slate-500">
              {usuario.login} · {NOME_DO_TIPO[usuario.tipo]}
            </p>
          )}
          {itens.map(link)}
          {usuario ? (
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                sair({ para: "/" });
              }}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          ) : (
            link({ href: "/login", rotulo: "Entrar" })
          )}
        </nav>
      )}
    </header>
  );
}
