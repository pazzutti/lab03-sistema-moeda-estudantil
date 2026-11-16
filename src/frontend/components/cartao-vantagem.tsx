"use client";

import { Coins, ImageOff } from "lucide-react";
import { useState } from "react";
import type { Vantagem } from "@/lib/tipos";

/**
 * Imagem da vantagem. A URL vem de qualquer dominio informado pela empresa,
 * por isso <img> em vez de next/image (que exige os dominios na config).
 */
export function FotoVantagem({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  // Guarda a URL que falhou: ao trocar a URL, tenta carregar de novo.
  const [falhou, setFalhou] = useState<string | null>(null);

  if (!src || falhou === src) {
    return (
      <div
        className={`grid place-items-center bg-slate-100 text-slate-400 ${className}`}
      >
        <ImageOff className="size-8" aria-label="Imagem indisponível" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFalhou(src)}
      className={`object-cover ${className}`}
    />
  );
}

/** Foto, nome, empresa, descricao e custo; "acoes" fica no rodape. */
export function CartaoVantagem({
  vantagem,
  acoes,
}: {
  vantagem: Vantagem;
  acoes?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <FotoVantagem
        src={vantagem.foto}
        alt={vantagem.nome}
        className="aspect-video w-full"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold break-words text-slate-900">
              {vantagem.nome}
            </h3>
            <p className="text-xs text-slate-500">{vantagem.empresa.nome}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700 tabular-nums">
            <Coins className="size-3.5" />
            {vantagem.custo.toLocaleString("pt-BR")}
            <span className="sr-only"> moedas</span>
          </span>
        </div>
        <p className="flex-1 text-sm whitespace-pre-line break-words text-slate-600">
          {vantagem.descricao}
        </p>
        {acoes && <div className="flex gap-2 pt-2">{acoes}</div>}
      </div>
    </article>
  );
}
