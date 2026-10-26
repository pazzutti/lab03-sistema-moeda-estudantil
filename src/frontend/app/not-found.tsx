import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        Página não encontrada
      </h1>
      <p className="mt-2 text-slate-600">
        O endereço acessado não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
