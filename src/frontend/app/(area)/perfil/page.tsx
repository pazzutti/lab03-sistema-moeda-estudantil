"use client";

import { useEffect, useState } from "react";
import { ExigirLogin, useAuth } from "@/components/auth";
import { ExcluirConta } from "@/components/excluir-conta";
import { useAvisos } from "@/components/toast";
import {
  Alerta,
  Botao,
  Campo,
  CampoSelecao,
  CampoSenha,
  Carregando,
  Cartao,
  LegendaObrigatorio,
  Secao,
} from "@/components/ui";
import { useDados } from "@/components/use-dados";
import { type Formulario, useFormulario } from "@/components/use-formulario";
import { formatarCnpj, formatarCpf } from "@/lib/documentos";
import type {
  Aluno,
  EmpresaParceira,
  Instituicao,
  UsuarioLogado,
} from "@/lib/tipos";
import * as regra from "@/lib/validacao";

export default function Perfil() {
  return (
    <ExigirLogin tipos={["ALUNO", "EMPRESA"]}>
      <ConteudoPerfil />
    </ExigirLogin>
  );
}

function ConteudoPerfil() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu perfil</h1>
        <p className="text-sm text-slate-500">
          Mantenha seus dados atualizados.
        </p>
      </div>

      {usuario.tipo === "ALUNO" ? (
        <PerfilAluno usuario={usuario} />
      ) : (
        <PerfilEmpresa usuario={usuario} />
      )}

      <Cartao
        titulo="Zona de perigo"
        descricao="A exclusão remove seu cadastro e seu acesso ao sistema."
        className="border-rose-200"
      >
        <ExcluirConta usuario={usuario} />
      </Cartao>
    </div>
  );
}

// ------------------------------- Aluno --------------------------------

const valoresAluno = (a: Aluno) => ({
  nome: a.nome,
  rg: a.rg,
  endereco: a.endereco,
  instituicaoId: String(a.instituicao.id),
  curso: a.curso,
  email: a.usuario.email,
  senha: "",
  confirmacao: "",
});

type ValoresAluno = ReturnType<typeof valoresAluno>;

function validarAluno(v: ValoresAluno) {
  const erros = regra.validar(v, {
    nome: [regra.obrigatorio("Informe o nome.")],
    rg: [regra.obrigatorio("Informe o RG.")],
    endereco: [regra.obrigatorio("Informe o endereço.")],
    curso: [regra.obrigatorio("Informe o curso.")],
    email: [regra.obrigatorio("Informe o email."), regra.email],
    senha: [regra.senhaOpcional],
  });
  if (v.senha && v.confirmacao !== v.senha) {
    erros.confirmacao = "As senhas não conferem.";
  }
  return erros;
}

function PerfilAluno({ usuario }: { usuario: UsuarioLogado }) {
  const aluno = useDados<Aluno>(`/alunos/${usuario.id}`);
  const instituicoes = useDados<Instituicao[]>("/instituicoes");

  if (aluno.erro) return <Alerta tipo="erro">{aluno.erro}</Alerta>;
  if (!aluno.dados || !instituicoes.dados) return <Carregando />;
  return (
    <FormularioAluno aluno={aluno.dados} instituicoes={instituicoes.dados} />
  );
}

function FormularioAluno({
  aluno,
  instituicoes,
}: {
  aluno: Aluno;
  instituicoes: Instituicao[];
}) {
  const form = useFormulario(valoresAluno(aluno), validarAluno);
  const salvar = useSalvar(`/alunos/${aluno.id}`, form, (atualizado: Aluno) =>
    form.redefinir(valoresAluno(atualizado)),
  );

  return (
    <Cartao titulo="Dados do aluno">
      <form onSubmit={salvar.enviar} noValidate className="flex flex-col gap-6">
        <LegendaObrigatorio />
        {form.erroGeral && <Alerta tipo="erro">{form.erroGeral}</Alerta>}

        <Secao titulo="Identificação">
          <Campo
            rotulo="Login"
            value={aluno.usuario.login}
            bloqueado
            dica="O login não pode ser alterado."
          />
          <Campo
            rotulo="CPF"
            value={formatarCpf(aluno.cpf)}
            bloqueado
            dica="O CPF não pode ser alterado."
          />
          <Campo
            rotulo="Nome completo"
            obrigatorio
            maxLength={120}
            className="sm:col-span-2"
            {...form.ligar("nome")}
          />
          <Campo rotulo="RG" obrigatorio maxLength={20} {...form.ligar("rg")} />
          <Campo
            rotulo="Email"
            obrigatorio
            type="email"
            maxLength={120}
            {...form.ligar("email")}
          />
          <Campo
            rotulo="Endereço"
            obrigatorio
            maxLength={255}
            className="sm:col-span-2"
            {...form.ligar("endereco")}
          />
        </Secao>

        <Secao titulo="Dados acadêmicos">
          <CampoSelecao
            rotulo="Instituição de ensino"
            obrigatorio
            {...form.ligar("instituicaoId")}
          >
            {instituicoes.map((i) => (
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

        <AlterarSenha form={form} />
        <BarraSalvar form={form} salvando={salvar.salvando} />
      </form>
    </Cartao>
  );
}

// ------------------------------ Empresa -------------------------------

const valoresEmpresa = (e: EmpresaParceira) => ({
  nome: e.nome,
  email: e.usuario.email,
  senha: "",
  confirmacao: "",
});

type ValoresEmpresa = ReturnType<typeof valoresEmpresa>;

function validarEmpresa(v: ValoresEmpresa) {
  const erros = regra.validar(v, {
    nome: [regra.obrigatorio("Informe o nome da empresa.")],
    email: [regra.obrigatorio("Informe o email."), regra.email],
    senha: [regra.senhaOpcional],
  });
  if (v.senha && v.confirmacao !== v.senha) {
    erros.confirmacao = "As senhas não conferem.";
  }
  return erros;
}

function PerfilEmpresa({ usuario }: { usuario: UsuarioLogado }) {
  const empresa = useDados<EmpresaParceira>(`/empresas/${usuario.id}`);
  if (empresa.erro) return <Alerta tipo="erro">{empresa.erro}</Alerta>;
  if (!empresa.dados) return <Carregando />;
  return <FormularioEmpresa empresa={empresa.dados} />;
}

function FormularioEmpresa({ empresa }: { empresa: EmpresaParceira }) {
  const form = useFormulario(valoresEmpresa(empresa), validarEmpresa);
  const salvar = useSalvar(
    `/empresas/${empresa.id}`,
    form,
    (atualizada: EmpresaParceira) => form.redefinir(valoresEmpresa(atualizada)),
  );

  return (
    <Cartao titulo="Dados da empresa">
      <form onSubmit={salvar.enviar} noValidate className="flex flex-col gap-6">
        <LegendaObrigatorio />
        {form.erroGeral && <Alerta tipo="erro">{form.erroGeral}</Alerta>}

        <Secao titulo="Identificação">
          <Campo
            rotulo="Login"
            value={empresa.usuario.login}
            bloqueado
            dica="O login não pode ser alterado."
          />
          <Campo
            rotulo="CNPJ"
            value={formatarCnpj(empresa.cnpj)}
            bloqueado
            dica="O CNPJ não pode ser alterado."
          />
          <Campo
            rotulo="Nome da empresa"
            obrigatorio
            maxLength={120}
            className="sm:col-span-2"
            {...form.ligar("nome")}
          />
          <Campo
            rotulo="Email"
            obrigatorio
            type="email"
            maxLength={120}
            className="sm:col-span-2"
            {...form.ligar("email")}
          />
        </Secao>

        <AlterarSenha form={form} />
        <BarraSalvar form={form} salvando={salvar.salvando} />
      </form>
    </Cartao>
  );
}

// ----------------------------- Comum ----------------------------------

/** Todo formulario de perfil tem a troca de senha com confirmacao. */
type ValoresPerfil = { senha: string; confirmacao: string } & Record<
  string,
  string
>;

/**
 * PATCH so com os campos alterados. Senha vazia mantem a atual e a
 * confirmacao nunca vai para a API.
 */
function useSalvar<T, V extends ValoresPerfil>(
  caminho: string,
  form: Formulario<V>,
  aoSalvar: (atualizado: T) => void,
) {
  const { api } = useAuth();
  const avisos = useAvisos();
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.validarTudo()) return;
    const dados: Record<string, string | number> = {};
    for (const campo of form.alterados) {
      if (campo === "confirmacao" || (campo === "senha" && !form.valores.senha))
        continue;
      const valor = form.valores[campo];
      dados[String(campo)] = campo === "instituicaoId" ? Number(valor) : valor;
    }
    setSalvando(true);
    try {
      aoSalvar(await api<T>(caminho, { method: "PATCH", body: dados }));
      avisos.sucesso("Alterações salvas com sucesso.");
    } catch (erro) {
      form.mostrarErroDaApi(erro);
    } finally {
      setSalvando(false);
    }
  }

  return { enviar, salvando };
}

function AlterarSenha<V extends ValoresPerfil>({
  form,
}: {
  form: Formulario<V>;
}) {
  return (
    <Secao titulo="Alterar senha">
      <CampoSenha
        rotulo="Nova senha"
        maxLength={72}
        autoComplete="new-password"
        dica="Deixe em branco para manter a senha atual."
        {...form.ligar("senha")}
      />
      <CampoSenha
        rotulo="Confirme a nova senha"
        maxLength={72}
        autoComplete="new-password"
        disabled={!form.valores.senha}
        {...form.ligar("confirmacao")}
      />
    </Secao>
  );
}

function BarraSalvar<V extends ValoresPerfil>({
  form,
  salvando,
}: {
  form: Formulario<V>;
  salvando: boolean;
}) {
  // Avisa antes de fechar a aba com alteracoes nao salvas.
  const { modificado } = form;
  useEffect(() => {
    if (!modificado) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [modificado]);

  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
      {form.modificado && (
        <p className="text-sm text-amber-700 sm:mr-auto">
          Você tem alterações não salvas.
        </p>
      )}
      <Botao
        variante="secundario"
        disabled={!form.modificado || salvando}
        onClick={() => form.redefinir(form.original)}
      >
        Descartar
      </Botao>
      <Botao type="submit" carregando={salvando} disabled={!form.modificado}>
        Salvar alterações
      </Botao>
    </div>
  );
}
