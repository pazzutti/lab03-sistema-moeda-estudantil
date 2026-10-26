"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth";
import { useAvisos } from "@/components/toast";
import {
  Alerta,
  Botao,
  Campo,
  CampoSelecao,
  CampoSenha,
  Cartao,
  LegendaObrigatorio,
  Secao,
} from "@/components/ui";
import { useDados } from "@/components/use-dados";
import { useFormulario } from "@/components/use-formulario";
import { requisitar } from "@/lib/api";
import { mascararCpf } from "@/lib/documentos";
import type { Instituicao } from "@/lib/tipos";
import * as regra from "@/lib/validacao";

const VAZIO = {
  nome: "",
  cpf: "",
  rg: "",
  endereco: "",
  instituicaoId: "",
  curso: "",
  email: "",
  login: "",
  senha: "",
  confirmacao: "",
};

type Valores = typeof VAZIO;

function validarAluno(v: Valores) {
  const erros = regra.validar(v, {
    nome: [regra.obrigatorio("Informe o nome.")],
    cpf: [regra.obrigatorio("Informe o CPF."), regra.cpf],
    rg: [regra.obrigatorio("Informe o RG.")],
    endereco: [regra.obrigatorio("Informe o endereço.")],
    instituicaoId: [regra.obrigatorio("Selecione a instituição de ensino.")],
    curso: [regra.obrigatorio("Informe o curso.")],
    email: [regra.obrigatorio("Informe o email."), regra.email],
    login: [regra.obrigatorio("Informe o login.")],
    senha: [regra.senha],
  });
  if (v.confirmacao !== v.senha) {
    erros.confirmacao = "As senhas não conferem.";
  }
  return erros;
}

export default function CadastroAluno() {
  const { entrar } = useAuth();
  const avisos = useAvisos();
  const instituicoes = useDados<Instituicao[]>("/instituicoes", {
    publico: true,
  });
  const form = useFormulario(VAZIO, validarAluno);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.validarTudo()) return;
    setEnviando(true);
    const { confirmacao: _confirmacao, ...dados } = form.valores;
    try {
      await requisitar("/alunos", {
        method: "POST",
        body: { ...dados, instituicaoId: Number(dados.instituicaoId) },
      });
      await entrar(dados.login, dados.senha);
      avisos.sucesso("Cadastro realizado! Você já está conectado.");
    } catch (erro) {
      form.mostrarErroDaApi(erro);
      setEnviando(false);
    }
  }

  return (
    <Cartao
      titulo="Cadastro de aluno"
      descricao="Participe do sistema de mérito e receba moedas dos seus professores."
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
        <LegendaObrigatorio />
        {form.erroGeral && <Alerta tipo="erro">{form.erroGeral}</Alerta>}

        <Secao titulo="Dados pessoais">
          <Campo
            rotulo="Nome completo"
            obrigatorio
            maxLength={120}
            autoComplete="name"
            className="sm:col-span-2"
            {...form.ligar("nome")}
          />
          <Campo
            rotulo="CPF"
            obrigatorio
            inputMode="numeric"
            placeholder="000.000.000-00"
            {...form.ligar("cpf", mascararCpf)}
          />
          <Campo
            rotulo="RG"
            obrigatorio
            maxLength={20}
            {...form.ligar("rg")}
          />
          <Campo
            rotulo="Endereço"
            obrigatorio
            maxLength={255}
            autoComplete="street-address"
            className="sm:col-span-2"
            {...form.ligar("endereco")}
          />
        </Secao>

        <Secao titulo="Dados acadêmicos">
          <CampoSelecao
            rotulo="Instituição de ensino"
            obrigatorio
            disabled={instituicoes.carregando}
            dica={
              instituicoes.erro ??
              "Apenas instituições parceiras estão disponíveis."
            }
            {...form.ligar("instituicaoId")}
          >
            <option value="">
              {instituicoes.carregando ? "Carregando..." : "Selecione"}
            </option>
            {instituicoes.dados?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </CampoSelecao>
          <Campo
            rotulo="Curso"
            obrigatorio
            maxLength={120}
            {...form.ligar("curso")}
          />
        </Secao>

        <Secao titulo="Acesso ao sistema">
          <Campo
            rotulo="Email"
            obrigatorio
            type="email"
            maxLength={120}
            autoComplete="email"
            dica="Você receberá aqui os avisos de moedas recebidas."
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
            Criar conta
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
