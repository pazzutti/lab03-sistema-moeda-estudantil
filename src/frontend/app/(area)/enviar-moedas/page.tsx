"use client";

import { useState } from "react";
import { ExigirLogin, useAuth } from "@/components/auth";
import { useAvisos } from "@/components/toast";
import {
  Alerta,
  Botao,
  Campo,
  CampoSelecao,
  CampoTexto,
  Carregando,
  Cartao,
  LegendaObrigatorio,
} from "@/components/ui";
import { useDados } from "@/components/use-dados";
import { useFormulario } from "@/components/use-formulario";
import type { Aluno, Professor } from "@/lib/tipos";
import * as regra from "@/lib/validacao";

const VAZIO = { alunoId: "", quantidade: "", motivo: "" };

type Valores = typeof VAZIO;

function validarEnvio(v: Valores) {
  return regra.validar(v, {
    alunoId: [regra.obrigatorio("Selecione o aluno.")],
    quantidade: [regra.inteiroPositivo],
    motivo: [regra.obrigatorio("Informe o motivo.")],
  });
}

export default function EnviarMoedas() {
  return (
    <ExigirLogin tipos={["PROFESSOR"]}>
      <FormularioEnvio />
    </ExigirLogin>
  );
}

function FormularioEnvio() {
  const { api } = useAuth();
  const avisos = useAvisos();
  const alunos = useDados<Aluno[]>("/alunos");
  const professor = useDados<Professor>("/professores/me");
  const form = useFormulario(VAZIO, validarEnvio);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.validarTudo()) return;
    setEnviando(true);
    try {
      await api("/transacoes/envios", {
        method: "POST",
        body: {
          alunoId: Number(form.valores.alunoId),
          quantidade: Number(form.valores.quantidade),
          motivo: form.valores.motivo,
        },
      });
      avisos.sucesso("Moedas enviadas! O aluno será avisado por email.");
      form.redefinir(VAZIO);
      professor.recarregar();
    } catch (erro) {
      form.mostrarErroDaApi(erro);
    } finally {
      setEnviando(false);
    }
  }

  const erro = alunos.erro ?? professor.erro;
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>;
  if (!alunos.dados || !professor.dados) return <Carregando />;

  return (
    <Cartao
      titulo="Enviar moedas"
      descricao={`Seu saldo: ${professor.dados.saldo.toLocaleString("pt-BR")} moedas.`}
      className="mx-auto w-full max-w-lg"
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <LegendaObrigatorio />
        {form.erroGeral && <Alerta tipo="erro">{form.erroGeral}</Alerta>}

        <CampoSelecao rotulo="Aluno" obrigatorio {...form.ligar("alunoId")}>
          <option value="">Selecione...</option>
          {alunos.dados
            .filter((a) => a.instituicao.id === professor.dados?.instituicao.id)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} · {a.curso}
              </option>
            ))}
        </CampoSelecao>
        <Campo
          rotulo="Quantidade de moedas"
          obrigatorio
          type="number"
          min={1}
          step={1}
          {...form.ligar("quantidade")}
        />
        <CampoTexto
          rotulo="Motivo do reconhecimento"
          obrigatorio
          rows={4}
          {...form.ligar("motivo")}
        />

        <Botao type="submit" carregando={enviando}>
          Enviar moedas
        </Botao>
      </form>
    </Cartao>
  );
}
