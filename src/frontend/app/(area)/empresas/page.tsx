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
import { formatarCnpj } from "@/lib/documentos";
import type { EmpresaParceira } from "@/lib/tipos";

export default function Empresas() {
  const { usuario } = useAuth();
  const { dados, erro, carregando, recarregar } =
    useDados<EmpresaParceira[]>("/empresas");
  const [busca, setBusca] = useState("");

  const ehEmpresa = usuario?.tipo === "EMPRESA";
  const termo = normalizar(busca.trim());
  const empresas = (dados ?? []).filter((e) =>
    normalizar(`${e.nome} ${e.cnpj} ${e.usuario.email}`).includes(
      termo.replace(/[./-]/g, ""),
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoLista
        titulo="Empresas parceiras"
        descricao={
          dados
            ? `${dados.length} empresa(s) oferecendo vantagens aos alunos.`
            : "Empresas que oferecem vantagens aos alunos."
        }
        busca={busca}
        aoBuscar={setBusca}
        placeholder="Buscar por nome ou CNPJ"
      />

      <Alerta>
        {ehEmpresa
          ? "Você pode editar ou excluir apenas o cadastro da sua empresa."
          : "Somente a própria empresa pode editar ou excluir o seu cadastro."}
      </Alerta>

      <EstadoLista
        carregando={carregando}
        erro={erro}
        vazia={empresas.length === 0}
        filtrada={termo !== ""}
        recarregar={recarregar}
      >
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={TH}>Empresa</th>
              <th className={TH}>CNPJ</th>
              <th className={`${TH} hidden md:table-cell`}>Email</th>
              {ehEmpresa && (
                <th className={TH}>
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {empresas.map((empresa) => {
              const propria = ehEmpresa && empresa.id === usuario?.id;
              return (
                <tr
                  key={empresa.id}
                  className={propria ? "bg-indigo-50/50" : ""}
                >
                  <td className={`${TD} font-medium text-slate-900`}>
                    {empresa.nome}
                    {propria && <SeloVoce />}
                  </td>
                  <td className={`${TD} font-mono text-xs`}>
                    {formatarCnpj(empresa.cnpj)}
                  </td>
                  <td className={`${TD} hidden md:table-cell`}>
                    {empresa.usuario.email}
                  </td>
                  {ehEmpresa && (
                    <td className={`${TD} w-24`}>
                      {propria && usuario && (
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
