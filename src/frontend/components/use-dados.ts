"use client";

import { useCallback, useEffect, useState } from "react";
import { requisitar } from "@/lib/api";
import { useAuth } from "./auth";

interface Estado<T> {
  dados: T | null;
  erro: string | null;
  carregando: boolean;
}

/**
 * GET na API ao montar a tela. Com o Activity do Next, a busca roda de novo
 * sempre que o usuario volta para a pagina, entao a lista nao fica velha.
 * "publico" busca sem token (ex.: instituicoes no cadastro).
 */
export function useDados<T>(caminho: string | null, { publico = false } = {}) {
  const { api, status } = useAuth();
  const [estado, setEstado] = useState<Estado<T>>({
    dados: null,
    erro: null,
    carregando: true,
  });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    // Telas da area logada esperam a sessao antes de buscar.
    if (!caminho || (!publico && status !== "autenticado")) return;
    let ativo = true;
    const busca = publico ? requisitar<T>(caminho) : api<T>(caminho);
    busca
      .then((dados) => {
        if (ativo) setEstado({ dados, erro: null, carregando: false });
      })
      .catch((erro: Error) => {
        if (ativo) {
          setEstado((atual) => ({ ...atual, erro: erro.message, carregando: false }));
        }
      });
    return () => {
      ativo = false;
    };
  }, [caminho, publico, status, api, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return { ...estado, recarregar };
}
