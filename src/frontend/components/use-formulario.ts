"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";

type Erros<T> = Partial<Record<keyof T, string>>;

/**
 * Estado de um formulario: valida cada campo ao sair dele (sem acusar erro
 * antes de o usuario digitar), tudo de novo ao enviar, e exibe no campo
 * certo os erros devolvidos pela API.
 */
export function useFormulario<T extends Record<string, string>>(
  inicial: T,
  validar: (valores: T) => Erros<T>,
) {
  const [original, setOriginal] = useState(inicial);
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Erros<T>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  function alterar<K extends keyof T>(campo: K, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    // Corrigiu o campo: some com o erro antigo imediatamente.
    if (erros[campo]) {
      setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    }
  }

  /** Props para ligar um input: <Campo {...ligar("nome")} /> */
  function ligar<K extends keyof T>(campo: K, mascara?: (v: string) => string) {
    return {
      name: String(campo),
      value: valores[campo],
      erro: erros[campo],
      onChange: (
        evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      ) =>
        alterar(
          campo,
          mascara ? mascara(evento.target.value) : evento.target.value,
        ),
      onBlur: () => {
        if (valores[campo] === original[campo]) return;
        setErros((atuais) => ({ ...atuais, [campo]: validar(valores)[campo] }));
      },
    };
  }

  /** Valida tudo; devolve true se pode enviar. */
  function validarTudo(): boolean {
    const encontrados = validar(valores);
    setErros(encontrados);
    setErroGeral(null);
    return Object.values(encontrados).every((erro) => !erro);
  }

  /** Mostra o erro da API: no campo, se a API indicou qual, ou no topo. */
  function mostrarErroDaApi(erro: unknown) {
    if (erro instanceof ApiError && Object.keys(erro.campos).length > 0) {
      setErros(erro.campos as Erros<T>);
      setErroGeral(null);
      return;
    }
    setErroGeral(
      erro instanceof Error ? erro.message : "Erro inesperado. Tente de novo.",
    );
  }

  /** Novo ponto de partida (ex.: dados recarregados apos salvar). */
  function redefinir(novos: T) {
    setOriginal(novos);
    setValores(novos);
    setErros({});
    setErroGeral(null);
  }

  const alterados = (Object.keys(valores) as (keyof T)[]).filter(
    (campo) => valores[campo] !== original[campo],
  );

  return {
    original,
    valores,
    erros,
    erroGeral,
    ligar,
    alterar,
    validarTudo,
    mostrarErroDaApi,
    redefinir,
    alterados,
    modificado: alterados.length > 0,
  };
}

export type Formulario<T extends Record<string, string>> = ReturnType<
  typeof useFormulario<T>
>;
