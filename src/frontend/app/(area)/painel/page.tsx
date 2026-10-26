"use client";

import {
  Building2,
  CircleCheck,
  Clock,
  Coins,
  GraduationCap,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { Alerta, Carregando, Cartao } from "@/components/ui";
import { useDados } from "@/components/use-dados";
import { formatarCnpj } from "@/lib/documentos";
import {
  type Aluno,
  type EmpresaParceira,
  NOME_DO_TIPO,
  type TipoUsuario,
} from "@/lib/tipos";

// O que cada perfil pode fazer: as liberadas nesta release e as proximas.
const PERMISSOES: Record<TipoUsuario, { liberado: string[]; embreve: string[] }> =
  {
    ALUNO: {
      liberado: [
        "Ver e editar o seu cadastro",
        "Excluir a sua conta",
      ],
      embreve: [
        "Receber moedas dos professores",
        "Consultar o extrato",
        "Trocar moedas por vantagens",
      ],
    },
    EMPRESA: {
      liberado: [
        "Ver e editar o cadastro da empresa",
        "Excluir a conta da empresa",
      ],
      embreve: ["Cadastrar vantagens", "Conferir cupons de resgate"],
    },
    PROFESSOR: {
      liberado: [],
      embreve: ["Enviar moedas aos alunos", "Consultar o extrato"],
    },
  };

export default function Painel() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  const permissoes = PERMISSOES[usuario.tipo];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-slate-500">{NOME_DO_TIPO[usuario.tipo]}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {usuario.login}!
        </h1>
      </div>

      {usuario.tipo === "ALUNO" && <ResumoAluno id={usuario.id} />}
      {usuario.tipo === "EMPRESA" && <ResumoEmpresa id={usuario.id} />}

      <Cartao
        titulo="O que você pode fazer"
        descricao="As ações disponíveis dependem do seu tipo de conta."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <ul className="flex flex-col gap-2">
            {permissoes.liberado.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm">
                <CircleCheck className="size-4 text-emerald-600" /> {p}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-2">
            {permissoes.embreve.map((p) => (
              <li
                key={p}
                className="flex items-center gap-2 text-sm text-slate-500"
              >
                <Clock className="size-4" /> {p}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  em breve
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Cartao>
    </div>
  );
}

function ResumoAluno({ id }: { id: number }) {
  const { dados: aluno, erro } = useDados<Aluno>(`/alunos/${id}`);
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;
  if (!aluno) return <Carregando />;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl bg-indigo-600 p-6 text-white shadow-sm">
        <p className="flex items-center gap-2 text-sm text-indigo-100">
          <Coins className="size-4" /> Saldo atual
        </p>
        <p className="mt-2 text-4xl font-bold">
          {aluno.saldo.toLocaleString("pt-BR")}
        </p>
        <p className="mt-1 text-sm text-indigo-100">moedas</p>
      </div>
      <Cartao className="sm:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{aluno.nome}</p>
              <p className="text-sm text-slate-600">
                {aluno.curso} · {aluno.instituicao.nome}
              </p>
              <p className="text-sm text-slate-500">{aluno.usuario.email}</p>
            </div>
          </div>
          <LinkEditar />
        </div>
      </Cartao>
    </div>
  );
}

function ResumoEmpresa({ id }: { id: number }) {
  const { dados: empresa, erro } = useDados<EmpresaParceira>(
    `/empresas/${id}`,
  );
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;
  if (!empresa) return <Carregando />;

  return (
    <Cartao>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{empresa.nome}</p>
            <p className="text-sm text-slate-600">
              CNPJ {formatarCnpj(empresa.cnpj)}
            </p>
            <p className="text-sm text-slate-500">{empresa.usuario.email}</p>
          </div>
        </div>
        <LinkEditar />
      </div>
    </Cartao>
  );
}

function LinkEditar() {
  return (
    <Link
      href="/perfil"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <Pencil className="size-3.5" /> Editar
    </Link>
  );
}
