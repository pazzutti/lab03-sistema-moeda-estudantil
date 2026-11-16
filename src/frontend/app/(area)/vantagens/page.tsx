"use client";

import { Coins, Gift, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ExigirLogin, useAuth } from "@/components/auth";
import { CartaoVantagem, FotoVantagem } from "@/components/cartao-vantagem";
import { CodigoCupom } from "@/components/codigo-cupom";
import { Alerta, Botao, Carregando, Dialogo } from "@/components/ui";
import { useDados } from "@/components/use-dados";
import type { Aluno, ResultadoDoResgate, Vantagem } from "@/lib/tipos";

const moedas = (quantidade: number) =>
  `${quantidade.toLocaleString("pt-BR")} ${quantidade === 1 ? "moeda" : "moedas"}`;

export default function PaginaVantagens() {
  return (
    <ExigirLogin tipos={["ALUNO"]}>
      <Catalogo />
    </ExigirLogin>
  );
}

/** Vantagens de todas as empresas (HU07), com o resgate de cada uma (HU08). */
function Catalogo() {
  const { usuario } = useAuth();
  const vantagens = useDados<Vantagem[]>("/vantagens");
  const aluno = useDados<Aluno>(usuario ? `/alunos/${usuario.id}` : null);
  const [escolhida, setEscolhida] = useState<Vantagem | null>(null);

  const erro = vantagens.erro ?? aluno.erro;
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;
  if (!vantagens.dados || !aluno.dados) return <Carregando />;
  const { saldo } = aluno.dados;

  function atualizar() {
    aluno.recarregar();
    vantagens.recarregar();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vantagens</h1>
          <p className="text-sm text-slate-500">
            Troque suas moedas por vantagens oferecidas pelas empresas
            parceiras.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white sm:self-auto">
          <Coins className="size-4" /> Seu saldo: {moedas(saldo)}
        </p>
      </div>

      {vantagens.dados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-600">
            <Gift className="size-6" />
          </span>
          <p className="font-medium text-slate-900">
            Nenhuma vantagem disponível no momento
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            Quando as empresas parceiras cadastrarem vantagens, elas aparecerão
            aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vantagens.dados.map((v) => {
            const falta = v.custo - saldo;
            return (
              <CartaoVantagem
                key={v.id}
                vantagem={v}
                acoes={
                  <Botao
                    className="flex-1"
                    disabled={falta > 0}
                    onClick={() => setEscolhida(v)}
                  >
                    {falta > 0 ? (
                      `Faltam ${moedas(falta)}`
                    ) : (
                      <>
                        <Gift className="size-4" /> Resgatar
                      </>
                    )}
                  </Botao>
                }
              />
            );
          })}
        </div>
      )}

      <Dialogo
        aberto={escolhida !== null}
        aoFechar={() => setEscolhida(null)}
        titulo="Resgatar vantagem"
      >
        {escolhida && (
          <Resgate
            // Cada abertura comeca na confirmacao.
            key={escolhida.id}
            vantagem={escolhida}
            saldo={saldo}
            aoResgatar={atualizar}
            aoFechar={() => setEscolhida(null)}
          />
        )}
      </Dialogo>
    </div>
  );
}

/** Confirmacao do resgate e, depois dele, o codigo do cupom gerado. */
function Resgate({
  vantagem,
  saldo,
  aoResgatar,
  aoFechar,
}: {
  vantagem: Vantagem;
  saldo: number;
  aoResgatar: () => void;
  aoFechar: () => void;
}) {
  const { api } = useAuth();
  const [resgatando, setResgatando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoDoResgate | null>(null);

  async function confirmar() {
    setResgatando(true);
    setErro(null);
    try {
      setResultado(
        await api<ResultadoDoResgate>("/transacoes/resgates", {
          method: "POST",
          body: { vantagemId: vantagem.id },
        }),
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível resgatar.");
    } finally {
      setResgatando(false);
      // Atualiza o saldo; num erro, a vantagem pode ter mudado ou saido.
      aoResgatar();
    }
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <TicketCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">Resgate concluído!</p>
            <p className="text-sm break-words text-slate-500">
              {vantagem.nome}
            </p>
          </div>
        </div>
        <CodigoCupom codigo={resultado.codigo} grande />
        <p className="text-sm text-slate-600">
          Apresente este código na <strong>{vantagem.empresa.nome}</strong>{" "}
          para receber a vantagem. Enviamos o cupom para o seu email, e a
          empresa recebeu o mesmo código para conferir a troca.
        </p>
        <p className="text-sm text-slate-600">
          Seu saldo agora é de <strong>{moedas(resultado.saldo)}</strong>.
        </p>
        <div className="flex justify-end gap-2">
          <Link
            href="/meus-resgates"
            onClick={aoFechar}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ver meus resgates
          </Link>
          <Botao onClick={aoFechar}>Fechar</Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <FotoVantagem
          src={vantagem.foto}
          alt=""
          className="size-16 shrink-0 rounded-lg"
        />
        <div className="min-w-0">
          <p className="font-semibold break-words text-slate-900">
            {vantagem.nome}
          </p>
          <p className="text-sm text-slate-500">{vantagem.empresa.nome}</p>
        </div>
      </div>

      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 p-4 text-sm">
        <dt className="text-slate-600">Seu saldo</dt>
        <dd className="text-right tabular-nums text-slate-900">
          {moedas(saldo)}
        </dd>
        <dt className="text-slate-600">Custo da vantagem</dt>
        <dd className="text-right tabular-nums text-rose-600">
          − {moedas(vantagem.custo)}
        </dd>
        <dt className="border-t border-slate-200 pt-1.5 font-semibold text-slate-900">
          Saldo após o resgate
        </dt>
        <dd className="border-t border-slate-200 pt-1.5 text-right font-semibold tabular-nums text-slate-900">
          {moedas(saldo - vantagem.custo)}
        </dd>
      </dl>

      <p className="text-sm text-slate-600">
        Você receberá por email um cupom com um código para apresentar na
        empresa.
      </p>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <div className="flex justify-end gap-2">
        <Botao variante="secundario" onClick={aoFechar}>
          Cancelar
        </Botao>
        <Botao onClick={confirmar} carregando={resgatando}>
          Confirmar resgate
        </Botao>
      </div>
    </div>
  );
}
