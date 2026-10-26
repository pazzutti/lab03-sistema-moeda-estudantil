"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type TipoAviso = "sucesso" | "erro";

interface Aviso {
  id: number;
  tipo: TipoAviso;
  texto: string;
}

interface Avisos {
  sucesso: (texto: string) => void;
  erro: (texto: string) => void;
}

const AvisosContext = createContext<Avisos | null>(null);

let proximoId = 0;

/** Retorno visual apos cada acao (salvar, excluir, entrar...). */
export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const fechar = useCallback((id: number) => {
    setAvisos((atuais) => atuais.filter((a) => a.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo: TipoAviso, texto: string) => {
      const id = ++proximoId;
      setAvisos((atuais) => [...atuais, { id, tipo, texto }]);
      setTimeout(() => fechar(id), tipo === "erro" ? 7000 : 4000);
    },
    [fechar],
  );

  const [api] = useState<Avisos>(() => ({
    sucesso: (texto) => mostrar("sucesso", texto),
    erro: (texto) => mostrar("erro", texto),
  }));

  return (
    <AvisosContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-6"
      >
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            role={aviso.tipo === "erro" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              aviso.tipo === "erro"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {aviso.tipo === "erro" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleCheck className="mt-0.5 size-4 shrink-0" />
            )}
            <p className="flex-1">{aviso.texto}</p>
            <button
              type="button"
              onClick={() => fechar(aviso.id)}
              aria-label="Fechar aviso"
              className="opacity-60 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export function useAvisos(): Avisos {
  const avisos = useContext(AvisosContext);
  if (!avisos) {
    throw new Error("useAvisos deve ser usado dentro de AvisosProvider");
  }
  return avisos;
}
