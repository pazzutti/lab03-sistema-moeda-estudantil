"use client";

import { Coins, Ticket } from "lucide-react";
import Link from "next/link";
import { ExigirLogin } from "@/components/auth";
import { FotoVantagem } from "@/components/cartao-vantagem";
import { CodigoCupom } from "@/components/codigo-cupom";
import { Alerta, Carregando } from "@/components/ui";
import { useDados } from "@/components/use-dados";
import type { Resgate } from "@/lib/tipos";

export default function PaginaMeusResgates() {
  return (
    <ExigirLogin tipos={["ALUNO"]}>
      <ListaDeResgates />
    </ExigirLogin>
  );
}

/** Vantagens que o aluno resgatou, com o codigo de cada cupom. */
function ListaDeResgates() {
  const { dados: resgates, erro } = useDados<Resgate[]>("/transacoes/resgates");
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;
  if (!resgates) return <Carregando />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meus resgates</h1>
        <p className="text-sm text-slate-500">
          Apresente o código do cupom na empresa para receber a vantagem. Ele
          também foi enviado para o seu email.
        </p>
      </div>

      {resgates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-600">
            <Ticket className="size-6" />
          </span>
          <p className="font-medium text-slate-900">
            Você ainda não resgatou vantagens
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            Troque suas moedas por descontos e produtos das empresas parceiras.
          </p>
          <Link
            href="/vantagens"
            className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Ver vantagens
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {resgates.map((resgate) => (
            <ItemResgate key={resgate.id} resgate={resgate} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemResgate({ resgate }: { resgate: Resgate }) {
  const { vantagem } = resgate;

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-4">
        <FotoVantagem
          src={vantagem?.foto ?? ""}
          alt={vantagem?.nome ?? "Vantagem indisponível"}
          className="size-20 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold break-words text-slate-900">
            {vantagem?.nome ?? "Vantagem indisponível"}
          </h2>
          <p className="text-sm text-slate-500">
            {vantagem?.empresa ?? "A empresa saiu do programa"}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <time dateTime={resgate.data}>
              Resgatado em{" "}
              {new Date(resgate.data).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </time>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <Coins className="size-3.5" />
              {resgate.quantidade.toLocaleString("pt-BR")}
              <span>{resgate.quantidade === 1 ? "moeda" : "moedas"}</span>
            </span>
          </p>
        </div>
      </div>
      <div className="sm:w-56">
        <CodigoCupom codigo={resgate.codigo} />
      </div>
    </li>
  );
}
