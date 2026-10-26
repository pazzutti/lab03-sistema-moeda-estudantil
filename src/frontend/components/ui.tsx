"use client";

import {
  CircleAlert,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  Lock,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div
      role="status"
      className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-slate-500"
    >
      <LoaderCircle className="size-5 animate-spin" />
      {texto}
    </div>
  );
}

export function Cartao({
  titulo,
  descricao,
  children,
  className = "",
}: {
  titulo?: string;
  descricao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {titulo && (
        <header className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          {descricao && (
            <p className="mt-1 text-sm text-slate-500">{descricao}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

type VarianteBotao = "primario" | "secundario" | "perigo" | "fantasma";

const ESTILO_BOTAO: Record<VarianteBotao, string> = {
  primario:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600",
  secundario:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400",
  perigo:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600",
  fantasma: "text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400",
};

export function Botao({
  variante = "primario",
  carregando = false,
  className = "",
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao;
  carregando?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${ESTILO_BOTAO[variante]} ${className}`}
      {...props}
    >
      {carregando && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

const ESTILO_INPUT =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500";

function estiloInput(erro?: string) {
  return `${ESTILO_INPUT} ${
    erro
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
  }`;
}

interface PropsCampo {
  rotulo: string;
  obrigatorio?: boolean;
  erro?: string;
  dica?: string;
  /** Campo que nao pode ser alterado depois do cadastro. */
  bloqueado?: boolean;
}

/** Rotulo + input + mensagem de erro ou dica, com acessibilidade. */
export function Campo({
  rotulo,
  obrigatorio,
  erro,
  dica,
  bloqueado,
  className,
  ...input
}: PropsCampo & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <Rotulo htmlFor={id} obrigatorio={obrigatorio}>
        {rotulo}
      </Rotulo>
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!erro}
          aria-describedby={`${id}-ajuda`}
          disabled={bloqueado || input.disabled}
          className={`${estiloInput(erro)} ${bloqueado ? "pr-9" : ""}`}
          {...input}
        />
        {bloqueado && (
          <Lock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        )}
      </div>
      <Ajuda id={`${id}-ajuda`} erro={erro} dica={dica} />
    </div>
  );
}

export function CampoSenha({
  rotulo,
  obrigatorio,
  erro,
  dica,
  className,
  ...input
}: PropsCampo & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [visivel, setVisivel] = useState(false);
  return (
    <div className={className}>
      <Rotulo htmlFor={id} obrigatorio={obrigatorio}>
        {rotulo}
      </Rotulo>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          aria-invalid={!!erro}
          aria-describedby={`${id}-ajuda`}
          className={`${estiloInput(erro)} pr-10`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisivel(!visivel)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Ajuda id={`${id}-ajuda`} erro={erro} dica={dica} />
    </div>
  );
}

export function CampoSelecao({
  rotulo,
  obrigatorio,
  erro,
  dica,
  className,
  children,
  ...select
}: PropsCampo & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className={className}>
      <Rotulo htmlFor={id} obrigatorio={obrigatorio}>
        {rotulo}
      </Rotulo>
      <select
        id={id}
        aria-invalid={!!erro}
        aria-describedby={`${id}-ajuda`}
        className={estiloInput(erro)}
        {...select}
      >
        {children}
      </select>
      <Ajuda id={`${id}-ajuda`} erro={erro} dica={dica} />
    </div>
  );
}

function Rotulo({
  htmlFor,
  obrigatorio,
  children,
}: {
  htmlFor: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-medium text-slate-700"
    >
      {children}
      {obrigatorio && (
        <span className="ml-0.5 text-rose-600" aria-hidden>
          *
        </span>
      )}
      {obrigatorio && <span className="sr-only"> (obrigatório)</span>}
    </label>
  );
}

function Ajuda({ id, erro, dica }: { id: string; erro?: string; dica?: string }) {
  if (erro) {
    return (
      <p id={id} className="mt-1 flex items-center gap-1 text-xs text-rose-600">
        <CircleAlert className="size-3.5 shrink-0" />
        {erro}
      </p>
    );
  }
  return dica ? (
    <p id={id} className="mt-1 text-xs text-slate-500">
      {dica}
    </p>
  ) : null;
}

/** Grupo de campos de um formulario, em duas colunas no desktop. */
export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

/** Legenda dos campos obrigatorios, no topo de cada formulario. */
export function LegendaObrigatorio() {
  return (
    <p className="text-xs text-slate-500">
      Campos marcados com <span className="text-rose-600">*</span> são
      obrigatórios.
    </p>
  );
}

export function Alerta({
  tipo = "info",
  children,
}: {
  tipo?: "info" | "erro";
  children: React.ReactNode;
}) {
  const erro = tipo === "erro";
  return (
    <div
      role={erro ? "alert" : undefined}
      className={`flex gap-2 rounded-lg border px-3 py-2.5 text-sm ${
        erro
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-indigo-100 bg-indigo-50 text-indigo-900"
      }`}
    >
      {erro ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
      ) : (
        <Info className="mt-0.5 size-4 shrink-0" />
      )}
      <div>{children}</div>
    </div>
  );
}

/** Modal nativo (<dialog>): foco preso, Esc fecha, fundo escurecido. */
export function Dialogo({
  aberto,
  aoFechar,
  titulo,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
