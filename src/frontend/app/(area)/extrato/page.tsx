"use client";

import { ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";
import { ExigirLogin, useAuth } from "@/components/auth";
import { Alerta, Carregando, Cartao } from "@/components/ui";
import { useDados } from "@/components/use-dados";
import type { Extrato, ItemDoExtrato } from "@/lib/tipos";

export default function PaginaExtrato() {
  return (
    <ExigirLogin tipos={["ALUNO", "PROFESSOR"]}>
      <ConteudoExtrato />
    </ExigirLogin>
  );
}

function ConteudoExtrato() {
  const { usuario } = useAuth();
  const { dados: extrato, erro } = useDados<Extrato>("/transacoes/extrato");
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;
  if (!extrato) return <Carregando />;

  const professor = usuario?.tipo === "PROFESSOR";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Extrato</h1>

      <div className="rounded-xl bg-indigo-600 p-6 text-white shadow-sm">
        <p className="flex items-center gap-2 text-sm text-indigo-100">
          <Coins className="size-4" /> Saldo atual
        </p>
        <p className="mt-2 text-4xl font-bold">
          {extrato.saldo.toLocaleString("pt-BR")}
        </p>
        <p className="mt-1 text-sm text-indigo-100">
          {professor ? "moedas disponíveis para enviar" : "moedas disponíveis"}
        </p>
      </div>

      <Cartao
        titulo="Transações"
        descricao={
          professor
            ? "Envios aos alunos e créditos semestrais, do mais recente ao mais antigo."
            : "Moedas recebidas dos professores, da mais recente à mais antiga."
        }
      >
        {extrato.transacoes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            {professor
              ? "Você ainda não enviou moedas."
              : "Quando um professor enviar moedas para você, elas aparecerão aqui."}
          </p>
        ) : (
          <ul className="-my-4 divide-y divide-slate-100">
            {extrato.transacoes.map((item) => (
              <LinhaDoExtrato key={`${item.tipo}-${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}

/** Texto de cada tipo de transacao e se as moedas entraram ou sairam. */
function descrever(item: ItemDoExtrato) {
  switch (item.tipo) {
    case "ENVIO":
      return {
        titulo: `Envio para ${item.aluno ?? "aluno com conta excluída"}`,
        detalhe: item.motivo,
        entrada: false,
      };
    case "CREDITO_SEMESTRAL":
      return {
        titulo: `Crédito do semestre ${item.semestre}`,
        detalhe: "Recarga semestral automática",
        entrada: true,
      };
    case "RECEBIMENTO":
      return {
        titulo: `Recebido de ${item.professor}`,
        detalhe: item.motivo,
        entrada: true,
      };
  }
}

function LinhaDoExtrato({ item }: { item: ItemDoExtrato }) {
  const { titulo, detalhe, entrada } = descrever(item);
  const Seta = entrada ? ArrowDownLeft : ArrowUpRight;

  return (
    <li className="flex items-start gap-3 py-4">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          entrada ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        }`}
      >
        <Seta className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{titulo}</p>
        <p className="mt-0.5 whitespace-pre-line break-words text-sm text-slate-600">
          {detalhe}
        </p>
        <time dateTime={item.data} className="mt-1 block text-xs text-slate-500">
          {new Date(item.data).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </time>
      </div>
      <p
        className={`shrink-0 font-semibold tabular-nums ${
          entrada ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        <span className="sr-only">{entrada ? "Entrada de" : "Saída de"} </span>
        {entrada ? "+" : "−"}
        {item.quantidade.toLocaleString("pt-BR")}
      </p>
    </li>
  );
}
