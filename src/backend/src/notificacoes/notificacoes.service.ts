import { Injectable, Logger } from '@nestjs/common';
import { type Email, EmailService } from './email.service.js';
import { emailTemplates } from './templates/email-templates.js';

interface Destinatario {
  nome: string;
  email: string;
}

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Chamado depois do commit: as moedas ja foram movimentadas, entao uma
   * falha no email e registrada no log e nao desfaz nem reprova o envio.
   */
  async notificarEnvioDeMoedas(dados: {
    professor: Destinatario;
    aluno: Destinatario;
    quantidade: number;
    motivo: string;
    saldoProfessor: number;
  }): Promise<void> {
    const { professor, aluno, quantidade, motivo, saldoProfessor } = dados;

    await Promise.all([
      this.enviarSemFalhar({
        para: professor,
        assunto: 'Confirmação do seu envio de moedas',
        html: emailTemplates.confirmacaoProfessor({
          nomeProfessor: professor.nome,
          nomeAluno: aluno.nome,
          quantidade,
          motivo,
          saldo: saldoProfessor,
        }),
      }),
      this.enviarSemFalhar({
        para: aluno,
        assunto: `Você recebeu moedas de ${professor.nome}`,
        html: emailTemplates.recebimentoAluno({
          nomeAluno: aluno.nome,
          nomeProfessor: professor.nome,
          quantidade,
          motivo,
        }),
      }),
    ]);
  }

  /**
   * Cupom para o aluno (HU08) e conferencia para a empresa (HU15), com o
   * mesmo codigo. Tambem chamado depois do commit, como o envio de moedas.
   */
  async notificarResgate(dados: {
    aluno: Destinatario;
    empresa: Destinatario;
    vantagem: string;
    custo: number;
    codigo: string;
    saldoAluno: number;
  }): Promise<void> {
    const { aluno, empresa, vantagem, custo, codigo, saldoAluno } = dados;

    await Promise.all([
      this.enviarSemFalhar({
        para: aluno,
        assunto: `Seu cupom ${codigo}: ${vantagem}`,
        html: emailTemplates.cupomAluno({
          nomeAluno: aluno.nome,
          nomeVantagem: vantagem,
          nomeEmpresa: empresa.nome,
          custo,
          codigo,
          saldo: saldoAluno,
        }),
      }),
      this.enviarSemFalhar({
        para: empresa,
        // O codigo no assunto facilita achar o email na hora da conferencia.
        assunto: `Resgate para conferir: cupom ${codigo}`,
        html: emailTemplates.conferenciaEmpresa({
          nomeEmpresa: empresa.nome,
          nomeAluno: aluno.nome,
          nomeVantagem: vantagem,
          custo,
          codigo,
        }),
      }),
    ]);
  }

  private async enviarSemFalhar(email: Email): Promise<void> {
    try {
      await this.emailService.enviar(email);
    } catch (erro) {
      // So a mensagem: o objeto do erro traz os headers, com o token da API.
      const motivo = erro instanceof Error ? erro.message : String(erro);
      this.logger.error(
        `Falha ao enviar email para ${email.para.email}: ${motivo}`,
      );
    }
  }
}
