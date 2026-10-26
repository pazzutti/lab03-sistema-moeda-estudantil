"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth";
import { useAvisos } from "@/components/toast";
import {
  Alerta,
  Botao,
  Campo,
  CampoSenha,
  Cartao,
  LegendaObrigatorio,
  Secao,
} from "@/components/ui";
import { useFormulario } from "@/components/use-formulario";
import { requisitar } from "@/lib/api";
import { mascararCnpj } from "@/lib/documentos";
import * as regra from "@/lib/validacao";

const VAZIO = {
  nome: "",
  cnpj: "",
  email: "",
  login: "",
  senha: "",
  confirmacao: "",
};

type Valores = typeof VAZIO;

function validarEmpresa(v: Valores) {
  const erros = regra.validar(v, {
    nome: [regra.obrigatorio("Informe o nome da empresa.")],
    cnpj: [regra.obrigatorio("Informe o CNPJ."), regra.cnpj],
    email: [regra.obrigatorio("Informe o email."), regra.email],
    login: [regra.obrigatorio("Informe o login.")],
    senha: [regra.senha],
  });
  if (v.confirmacao !== v.senha) {
    erros.confirmacao = "As senhas não conferem.";
  }
  return erros;
}

export default function CadastroEmpresa() {
  const { entrar } = useAuth();
  const avisos = useAvisos();
  const form = useFormulario(VAZIO, validarEmpresa);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.validarTudo()) return;
    setEnviando(true);
    const { confirmacao: _confirmacao, ...dados } = form.valores;
    try {
      await requisitar("/empresas", { method: "POST", body: dados });
      await entrar(dados.login, dados.senha);
      avisos.sucesso("Empresa cadastrada! Você já está conectado.");
    } catch (erro) {
      form.mostrarErroDaApi(erro);
      setEnviando(false);
    }
  }

  return (
    <Cartao
      titulo="Cadastro de empresa parceira"
      descricao="Ofereça vantagens aos alunos em troca de moedas estudantis."
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <LegendaObrigatorio />
        {form.erroGeral && <Alerta tipo="erro">{form.erroGeral}</Alerta>}

        <Secao titulo="Dados da empresa">
          <Campo
            rotulo="Nome da empresa"
            obrigatorio
            maxLength={120}
            autoComplete="organization"
            className="sm:col-span-2"
            {...form.ligar("nome")}
          />
          <Campo
            rotulo="CNPJ"
            obrigatorio
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            dica="Não pode ser alterado depois."
            className="sm:col-span-2"
            {...form.ligar("cnpj", mascararCnpj)}
          />
        </Secao>

        <Secao titulo="Acesso ao sistema">
          <Campo
            rotulo="Email"
            obrigatorio
            type="email"
            maxLength={120}
            autoComplete="email"
            dica="Os cupons dos resgates serão enviados para este email."
            className="sm:col-span-2"
            {...form.ligar("email")}
          />
          <Campo
            rotulo="Login"
            obrigatorio
            maxLength={60}
            autoComplete="username"
            dica="Não pode ser alterado depois."
            className="sm:col-span-2"
            {...form.ligar("login")}
          />
          <CampoSenha
            rotulo="Senha"
            obrigatorio
            maxLength={72}
            autoComplete="new-password"
            dica="Mínimo de 6 caracteres."
            {...form.ligar("senha")}
          />
          <CampoSenha
            rotulo="Confirme a senha"
            obrigatorio
            maxLength={72}
            autoComplete="new-password"
            {...form.ligar("confirmacao")}
          />
        </Secao>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:underline"
            >
              Entrar
            </Link>
          </p>
          <Botao type="submit" carregando={enviando}>
            Cadastrar empresa
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
