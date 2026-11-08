// Templates dos emails: aqui fica o texto fixo; os dados variaveis de cada
// envio chegam por parametro.

/** Nome e motivo sao digitados por usuarios e nao podem virar HTML. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function moedas(quantidade: number): string {
  return `${quantidade.toLocaleString('pt-BR')} ${quantidade === 1 ? 'moeda' : 'moedas'}`;
}

function layout(titulo: string, corpo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;">
      <tr>
        <td style="padding:20px 28px;background:#4f46e5;border-radius:12px 12px 0 0;color:#ffffff;font-weight:bold;">
          Moeda Estudantil
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;">${titulo}</h1>
          ${corpo}
          <p style="margin:24px 0 0;font-size:12px;color:#64748b;">
            Este é um email automático, não é preciso respondê-lo.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function blocoMotivo(motivo: string): string {
  return `<blockquote style="margin:16px 0;padding:12px 16px;background:#eef2ff;border-left:4px solid #4f46e5;white-space:pre-line;">${escapar(motivo)}</blockquote>`;
}

export const emailTemplates = {
  /** Confirma ao professor que o envio foi realizado. */
  confirmacaoProfessor(dados: {
    nomeProfessor: string;
    nomeAluno: string;
    quantidade: number;
    motivo: string;
    saldo: number;
  }): string {
    return layout(
      'Envio de moedas confirmado',
      `<p>Olá, ${escapar(dados.nomeProfessor)}!</p>
          <p>Seu envio de <strong>${moedas(dados.quantidade)}</strong> para <strong>${escapar(dados.nomeAluno)}</strong> foi realizado.</p>
          <p style="margin-bottom:0;">Motivo informado:</p>
          ${blocoMotivo(dados.motivo)}
          <p>Seu saldo atual é de <strong>${moedas(dados.saldo)}</strong>.</p>`,
    );
  },

  /** Avisa o aluno de que recebeu moedas (HU05). */
  recebimentoAluno(dados: {
    nomeAluno: string;
    nomeProfessor: string;
    quantidade: number;
    motivo: string;
  }): string {
    return layout(
      'Você recebeu moedas!',
      `<p>Olá, ${escapar(dados.nomeAluno)}!</p>
          <p><strong>${escapar(dados.nomeProfessor)}</strong> enviou <strong>${moedas(dados.quantidade)}</strong> para você em reconhecimento:</p>
          ${blocoMotivo(dados.motivo)}
          <p>Acesse o sistema para consultar seu extrato e trocar suas moedas por vantagens.</p>`,
    );
  },
};
