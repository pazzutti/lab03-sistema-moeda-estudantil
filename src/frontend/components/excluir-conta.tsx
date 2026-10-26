"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { UsuarioLogado } from "@/lib/tipos";
import { useAuth } from "./auth";
import { useAvisos } from "./toast";
import { Alerta, Botao, Campo, Dialogo } from "./ui";

/**
 * Exclusao do proprio cadastro (HU04). Para evitar clique acidental, o
 * usuario confirma digitando o proprio login.
 */
export function ExcluirConta({
  usuario,
  compacto = false,
}: {
  usuario: UsuarioLogado;
  compacto?: boolean;
}) {
  const { api, sair } = useAuth();
  const avisos = useAvisos();
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recurso = usuario.tipo === "ALUNO" ? "alunos" : "empresas";

  function fechar() {
    setAberto(false);
    setConfirmacao("");
    setErro(null);
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await api(`/${recurso}/${usuario.id}`, { method: "DELETE" });
      fechar();
      avisos.sucesso("Sua conta foi excluída.");
      sair({ para: "/" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      {compacto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Excluir minha conta"
          title="Excluir minha conta"
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="size-4" />
        </button>
      ) : (
        <Botao variante="perigo" onClick={() => setAberto(true)}>
          <Trash2 className="size-4" />
          Excluir minha conta
        </Botao>
      )}

      <Dialogo aberto={aberto} aoFechar={fechar} titulo="Excluir conta">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Seu cadastro e seu acesso serão removidos permanentemente.
            {usuario.tipo === "ALUNO" &&
              " O saldo de moedas acumulado será perdido."}{" "}
            <strong>Esta ação não pode ser desfeita.</strong>
          </p>
          {erro && <Alerta tipo="erro">{erro}</Alerta>}
          <Campo
            rotulo={`Para confirmar, digite seu login: ${usuario.login}`}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="off"
          />
          <div className="flex justify-end gap-2">
            <Botao variante="secundario" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              onClick={excluir}
              carregando={excluindo}
              disabled={confirmacao !== usuario.login}
            >
              Excluir definitivamente
            </Botao>
          </div>
        </div>
      </Dialogo>
    </>
  );
}
