import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailtrapClient } from 'mailtrap';

/**
 * Imagem embutida no corpo do email, referenciada no HTML por "cid:<cid>".
 * Gmail e Outlook bloqueiam imagens em "data:", mas exibem as embutidas.
 */
export interface ImagemEmbutida {
  cid: string;
  nomeArquivo: string;
  conteudo: Buffer;
  tipo: string;
}

export interface Email {
  para: { nome: string; email: string };
  assunto: string;
  html: string;
  imagens?: ImagemEmbutida[];
}

/** O plano gratuito da Sandbox do Mailtrap aceita 1 email a cada 10 segundos. */
const INTERVALO_PADRAO = 11_000;

/** Transporte dos emails, sem nenhuma regra de negocio. */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private fila: Promise<unknown> = Promise.resolve();

  constructor(private readonly config: ConfigService) {}

  enviar(email: Email): Promise<void> {
    const token = this.config.get<string>('MAILTRAP_API_TOKEN');

    // Sem token (ambiente local), o email so aparece no log.
    if (!token) {
      this.registrarNoLog(email);
      return Promise.resolve();
    }

    const intervalo = Number(
      this.config.get('MAILTRAP_INTERVALO_MS', INTERVALO_PADRAO),
    );
    const envio = this.fila.then(() => this.entregar(token, email));
    this.fila = envio
      .catch(() => undefined)
      .then(() => new Promise((resolve) => setTimeout(resolve, intervalo)));
    return envio;
  }

  private registrarNoLog({ para, assunto, html, imagens = [] }: Email): void {
    const texto = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const anexos = imagens.length
      ? `\n[imagens embutidas: ${imagens.map((i) => i.nomeArquivo).join(', ')}]`
      : '';
    this.logger.log(
      `[DEV MAIL] to=${para.email} subject="${assunto}"\n${texto}${anexos}`,
    );
  }

  private async entregar(
    token: string,
    { para, assunto, html, imagens = [] }: Email,
  ): Promise<void> {
    // Com o id de uma inbox, usa o Email Sandbox do Mailtrap, que captura as
    // mensagens e nao exige dominio verificado.
    const inbox = this.config.get<string>('MAILTRAP_TEST_INBOX_ID');
    const client = new MailtrapClient({
      token,
      ...(inbox ? { sandbox: true, testInboxId: Number(inbox) } : {}),
    });

    await client.send({
      from: {
        name: 'Moeda Estudantil',
        email: this.config.get('MAIL_FROM', 'noreply@moedaestudantil.com'),
      },
      to: [{ name: para.nome, email: para.email }],
      subject: assunto,
      html,
      ...(imagens.length
        ? {
            attachments: imagens.map((imagem) => ({
              filename: imagem.nomeArquivo,
              type: imagem.tipo,
              content: imagem.conteudo,
              disposition: 'inline',
              content_id: imagem.cid,
            })),
          }
        : {}),
    });
    this.logger.log(`Email enviado para ${para.email}: "${assunto}"`);
  }
}
