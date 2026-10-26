import { ArrowRight, Building2, Coins, GraduationCap } from "lucide-react";
import Link from "next/link";

const PASSOS = [
  {
    icone: GraduationCap,
    titulo: "Professores reconhecem",
    texto:
      "A cada semestre, cada professor recebe 1.000 moedas para distribuir aos alunos por participação e bom desempenho.",
  },
  {
    icone: Coins,
    titulo: "Alunos acumulam",
    texto:
      "O aluno recebe as moedas com uma mensagem do professor e acompanha o saldo no extrato.",
  },
  {
    icone: Building2,
    titulo: "Empresas oferecem vantagens",
    texto:
      "Empresas parceiras cadastram descontos e produtos que os alunos trocam por moedas.",
  },
];

export default function Inicio() {
  return (
    <div className="flex flex-col gap-16 py-8">
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Coins className="size-3.5" /> Reconhecimento do mérito estudantil
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Bom desempenho vale moeda.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Professores distribuem moedas virtuais aos alunos, que as trocam por
          descontos e produtos em empresas parceiras.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/cadastro/aluno"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Cadastrar como aluno <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/cadastro/empresa"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Quero ser empresa parceira
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {PASSOS.map(({ icone: Icone, titulo, texto }) => (
          <div
            key={titulo}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icone className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold text-slate-900">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-600">{texto}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
