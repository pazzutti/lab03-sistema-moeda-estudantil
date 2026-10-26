"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth";
import { useAvisos } from "@/components/toast";
import { Alerta, Botao, Campo, CampoSenha, Cartao } from "@/components/ui";

export default function Login() {
  const { entrar } = useAuth();
  const avisos = useAvisos();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!login.trim() || !senha) {
      setErro("Informe o login e a senha.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const usuario = await entrar(login.trim(), senha);
      // O redirecionamento para o painel e feito pelo SomenteAnonimo.
      avisos.sucesso(`Bem-vindo, ${usuario.login}!`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  return (
    <Cartao
      titulo="Entrar"
      descricao="Acesse com o login e a senha cadastrados."
      className="mx-auto w-full max-w-md"
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        <Campo
          rotulo="Login"
          autoComplete="username"
          autoFocus
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <CampoSenha
          rotulo="Senha"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <Botao type="submit" carregando={enviando} className="mt-2">
          Entrar
        </Botao>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Ainda não tem conta? Cadastre-se como{" "}
        <Link
          href="/cadastro/aluno"
          className="font-medium text-indigo-600 hover:underline"
        >
          aluno
        </Link>{" "}
        ou como{" "}
        <Link
          href="/cadastro/empresa"
          className="font-medium text-indigo-600 hover:underline"
        >
          empresa parceira
        </Link>
        .
      </p>
    </Cartao>
  );
}
