"use client";

import { Pencil, Search } from "lucide-react";
import Link from "next/link";
import { Alerta, Botao, Carregando } from "./ui";

/** Remove acentos e caixa, para a busca achar "Jose" em "José". */
export const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function CabecalhoLista({
  titulo,
  descricao,
  busca,
  aoBuscar,
  placeholder,
}: {
  titulo: string;
  descricao: string;
  busca: string;
  aoBuscar: (valor: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
        <p className="text-sm text-slate-500">{descricao}</p>
      </div>
      <label className="relative sm:w-72">
        <span className="sr-only">Buscar</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={busca}
          onChange={(e) => aoBuscar(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
    </div>
  );
}

/** Estados de carregamento, erro e lista vazia de uma tabela. */
export function EstadoLista({
  carregando,
  erro,
  vazia,
  filtrada,
  recarregar,
  children,
}: {
  carregando: boolean;
  erro: string | null;
  vazia: boolean;
  filtrada: boolean;
  recarregar: () => void;
  children: React.ReactNode;
}) {
  if (carregando) return <Carregando />;
  if (erro) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alerta tipo="erro">{erro}</Alerta>
        <Botao variante="secundario" onClick={recarregar}>
          Tentar novamente
        </Botao>
      </div>
    );
  }
  if (vazia) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
        {filtrada
          ? "Nenhum resultado para a busca."
          : "Nenhum cadastro encontrado."}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

export function SeloVoce() {
  return (
    <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
      Você
    </span>
  );
}

export function LinkEditarPerfil() {
  return (
    <Link
      href="/perfil"
      aria-label="Editar meu cadastro"
      title="Editar meu cadastro"
      className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
    >
      <Pencil className="size-4" />
    </Link>
  );
}

export const TH =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const TD = "px-4 py-3 text-sm text-slate-700";
