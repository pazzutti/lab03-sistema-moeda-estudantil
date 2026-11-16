"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Codigo do cupom em destaque, para o aluno mostrar na troca presencial, com
 * botao de copiar. "grande" e usado logo apos o resgate.
 */
export function CodigoCupom({
  codigo,
  grande = false,
}: {
  codigo: string;
  grande?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timer = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(timer);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
    } catch {
      // Sem permissao de area de transferencia: o codigo continua visivel.
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 ${
        grande ? "px-4 py-3" : "px-3 py-2"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-indigo-700 uppercase">
          Código do cupom
        </p>
        <p
          className={`font-mono font-bold tracking-[0.2em] text-indigo-950 ${
            grande ? "text-2xl" : "text-lg"
          }`}
        >
          {codigo}
        </p>
      </div>
      <button
        type="button"
        onClick={copiar}
        aria-label={copiado ? "Código copiado" : `Copiar código ${codigo}`}
        title={copiado ? "Copiado!" : "Copiar"}
        className="shrink-0 rounded-md p-2 text-indigo-700 transition hover:bg-indigo-100"
      >
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
