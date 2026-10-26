"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth";
import { ExcluirConta } from "@/components/excluir-conta";
import {
  CabecalhoLista,
  EstadoLista,
  LinkEditarPerfil,
  normalizar,
  SeloVoce,
  TD,
  TH,
} from "@/components/lista";
import { Alerta } from "@/components/ui";
import { useDados } from "@/components/use-dados";
import { formatarCpf, ocultarCpf } from "@/lib/documentos";
import type { Aluno } from "@/lib/tipos";

export default function Alunos() {
  const { usuario } = useAuth();
  const { dados, erro, carregando, recarregar } = useDados<Aluno[]>("/alunos");
  const [busca, setBusca] = useState("");

  const ehAluno = usuario?.tipo === "ALUNO";
  const termo = normalizar(busca.trim());
  const alunos = (dados ?? []).filter((a) =>
    normalizar(
      `${a.nome} ${a.curso} ${a.instituicao.nome} ${a.usuario.email}`,
    ).includes(termo),
  );

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoLista
        titulo="Alunos"
        descricao={
          dados
            ? `${dados.length} aluno(s) participando do sistema de mérito.`
            : "Alunos participando do sistema de mérito."
        }
        busca={busca}
        aoBuscar={setBusca}
        placeholder="Buscar por nome, curso ou instituição"
      />

      <Alerta>
        {ehAluno
          ? "Você pode editar ou excluir apenas o seu próprio cadastro. "
          : "Somente o próprio aluno pode editar ou excluir o cadastro. "}
        Para proteger a privacidade, o CPF e o saldo dos outros alunos ficam
        ocultos.
      </Alerta>

      <EstadoLista
        carregando={carregando}
        erro={erro}
        vazia={alunos.length === 0}
        filtrada={termo !== ""}
        recarregar={recarregar}
      >
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={TH}>Nome</th>
              <th className={`${TH} hidden md:table-cell`}>Email</th>
              <th className={`${TH} hidden lg:table-cell`}>CPF</th>
              <th className={TH}>Instituição / curso</th>
              <th className={`${TH} text-right`}>Saldo</th>
              {ehAluno && (
                <th className={TH}>
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alunos.map((aluno) => {
              const proprio = ehAluno && aluno.id === usuario?.id;
              return (
                <tr key={aluno.id} className={proprio ? "bg-indigo-50/50" : ""}>
                  <td className={`${TD} font-medium text-slate-900`}>
                    {aluno.nome}
                    {proprio && <SeloVoce />}
                  </td>
                  <td className={`${TD} hidden md:table-cell`}>
                    {aluno.usuario.email}
                  </td>
                  <td className={`${TD} hidden font-mono text-xs lg:table-cell`}>
                    {proprio ? formatarCpf(aluno.cpf) : ocultarCpf(aluno.cpf)}
                  </td>
                  <td className={TD}>
                    <p>{aluno.instituicao.nome}</p>
                    <p className="text-xs text-slate-500">{aluno.curso}</p>
                  </td>
                  <td className={`${TD} text-right tabular-nums`}>
                    {proprio ? (
                      aluno.saldo.toLocaleString("pt-BR")
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  {ehAluno && (
                    <td className={`${TD} w-24`}>
                      {proprio && usuario && (
                        <div className="flex justify-end gap-1">
                          <LinkEditarPerfil />
                          <ExcluirConta usuario={usuario} compacto />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </EstadoLista>
    </div>
  );
}
