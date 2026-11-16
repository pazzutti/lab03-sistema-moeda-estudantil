"use client";

import { Gift, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ExigirLogin, useAuth } from "@/components/auth";
import { CartaoVantagem, FotoVantagem } from "@/components/cartao-vantagem";
import { useAvisos } from "@/components/toast";
import {
  Alerta,
  Botao,
  Campo,
  CampoTexto,
  Carregando,
  Dialogo,
  LegendaObrigatorio,
} from "@/components/ui";
import { useDados } from "@/components/use-dados";
import { useFormulario } from "@/components/use-formulario";
import type { Vantagem } from "@/lib/tipos";
import * as regra from "@/lib/validacao";

export default function MinhasVantagens() {
  return (
    <ExigirLogin tipos={["EMPRESA"]}>
      <ListaDeVantagens />
    </ExigirLogin>
  );
}

function ListaDeVantagens() {
  const vantagens = useDados<Vantagem[]>("/vantagens/minhas");
  // "nova" abre o formulario vazio; uma vantagem abre a edicao dela.
  const [editando, setEditando] = useState<Vantagem | "nova" | null>(null);
  const [removendo, setRemovendo] = useState<Vantagem | null>(null);

  if (vantagens.erro) return <Alerta tipo="erro">{vantagens.erro}</Alerta>;
  if (!vantagens.dados) return <Carregando />;

  function aoSalvar() {
    setEditando(null);
    vantagens.recarregar();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Minhas vantagens
          </h1>
          <p className="text-sm text-slate-500">
            Os alunos trocam moedas pelas vantagens cadastradas aqui.
          </p>
        </div>
        <Botao onClick={() => setEditando("nova")}>
          <Plus className="size-4" /> Nova vantagem
        </Botao>
      </div>

      {vantagens.dados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-600">
            <Gift className="size-6" />
          </span>
          <p className="font-medium text-slate-900">
            Nenhuma vantagem cadastrada
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            Ofereça, por exemplo, um desconto no restaurante, na mensalidade ou
            na compra de materiais.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vantagens.dados.map((v) => (
            <CartaoVantagem
              key={v.id}
              vantagem={v}
              acoes={
                <>
                  <Botao
                    variante="secundario"
                    className="flex-1"
                    onClick={() => setEditando(v)}
                  >
                    <Pencil className="size-3.5" /> Editar
                  </Botao>
                  <Botao
                    variante="fantasma"
                    onClick={() => setRemovendo(v)}
                    aria-label={`Remover ${v.nome}`}
                    title="Remover"
                    className="hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </Botao>
                </>
              }
            />
          ))}
        </div>
      )}

      <Dialogo
        aberto={editando !== null}
        aoFechar={() => setEditando(null)}
        titulo={editando === "nova" ? "Nova vantagem" : "Editar vantagem"}
      >
        {editando !== null && (
          <FormularioVantagem
            // Cada abertura comeca de um formulario novo.
            key={editando === "nova" ? "nova" : editando.id}
            vantagem={editando === "nova" ? null : editando}
            aoSalvar={aoSalvar}
            aoCancelar={() => setEditando(null)}
          />
        )}
      </Dialogo>

      <ConfirmarRemocao
        vantagem={removendo}
        aoFechar={() => setRemovendo(null)}
        aoRemover={() => {
          setRemovendo(null);
          vantagens.recarregar();
        }}
      />
    </div>
  );
}

// ---------------------------- Formulario ------------------------------

const VAZIO = { nome: "", descricao: "", foto: "", custo: "" };

type Valores = typeof VAZIO;

const valoresDe = (v: Vantagem | null): Valores =>
  v
    ? { nome: v.nome, descricao: v.descricao, foto: v.foto, custo: String(v.custo) }
    : VAZIO;

function validarVantagem(v: Valores) {
  return regra.validar(v, {
    nome: [regra.obrigatorio("Informe o nome da vantagem.")],
    descricao: [regra.obrigatorio("Informe a descrição.")],
    foto: [regra.obrigatorio("Informe a URL da foto."), regra.url],
    custo: [regra.inteiroPositivo],
  });
}

/** Cadastro (HU13) ou edicao (HU14); na edicao, envia so o que mudou. */
function FormularioVantagem({
  vantagem,
  aoSalvar,
  aoCancelar,
}: {
  vantagem: Vantagem | null;
  aoSalvar: () => void;
  aoCancelar: () => void;
}) {
  const { api } = useAuth();
  const avisos = useAvisos();
  const form = useFormulario(valoresDe(vantagem), validarVantagem);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.validarTudo()) return;
    const campos = vantagem ? form.alterados : Object.keys(VAZIO);
    const dados: Record<string, string | number> = {};
    for (const campo of campos as (keyof Valores)[]) {
      const valor = form.valores[campo];
      dados[campo] = campo === "custo" ? Number(valor) : valor;
    }
    setSalvando(true);
    try {
      await api(vantagem ? `/vantagens/${vantagem.id}` : "/vantagens", {
        method: vantagem ? "PATCH" : "POST",
        body: dados,
      });
      avisos.sucesso(
        vantagem
          ? "Vantagem atualizada."
          : "Vantagem cadastrada! Ela já está disponível para os alunos.",
      );
      aoSalvar();
    } catch (erro) {
      form.mostrarErroDaApi(erro);
    } finally {
      setSalvando(false);
    }
  }

  // Previa so com uma URL valida, para nao piscar enquanto digita.
  const foto = form.valores.foto.trim();
  const previa = foto && !regra.url(foto) ? foto : "";

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <LegendaObrigatorio />
      {form.erroGeral && <Alerta tipo="erro">{form.erroGeral}</Alerta>}

      <Campo
        rotulo="Nome"
        obrigatorio
        maxLength={120}
        placeholder="Ex.: 20% de desconto no restaurante"
        {...form.ligar("nome")}
      />
      <CampoTexto
        rotulo="Descrição"
        obrigatorio
        rows={3}
        maxLength={1000}
        placeholder="Regras de uso, validade, onde apresentar o cupom..."
        {...form.ligar("descricao")}
      />
      <Campo
        rotulo="URL da foto"
        obrigatorio
        type="url"
        maxLength={500}
        placeholder="https://..."
        {...form.ligar("foto")}
      />
      {previa && (
        <FotoVantagem
          src={previa}
          alt="Prévia da foto"
          className="aspect-video w-full rounded-lg border border-slate-200"
        />
      )}
      <Campo
        rotulo="Custo em moedas"
        obrigatorio
        type="number"
        min={1}
        step={1}
        {...form.ligar("custo")}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao
          type="submit"
          carregando={salvando}
          disabled={vantagem !== null && !form.modificado}
        >
          {vantagem ? "Salvar alterações" : "Cadastrar vantagem"}
        </Botao>
      </div>
    </form>
  );
}

// ----------------------------- Remocao --------------------------------

function ConfirmarRemocao({
  vantagem,
  aoFechar,
  aoRemover,
}: {
  vantagem: Vantagem | null;
  aoFechar: () => void;
  aoRemover: () => void;
}) {
  const { api } = useAuth();
  const avisos = useAvisos();
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setErro(null);
    aoFechar();
  }

  async function remover() {
    if (!vantagem) return;
    setRemovendo(true);
    try {
      await api(`/vantagens/${vantagem.id}`, { method: "DELETE" });
      avisos.sucesso("Vantagem removida.");
      setErro(null);
      aoRemover();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível remover.");
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <Dialogo
      aberto={vantagem !== null}
      aoFechar={fechar}
      titulo="Remover vantagem"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          <strong>{vantagem?.nome}</strong> deixará de aparecer para os alunos.
          Os resgates já feitos continuam no extrato deles.
        </p>
        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={fechar}>
            Cancelar
          </Botao>
          <Botao variante="perigo" onClick={remover} carregando={removendo}>
            Remover
          </Botao>
        </div>
      </div>
    </Dialogo>
  );
}
