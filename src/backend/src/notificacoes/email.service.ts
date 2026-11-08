import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailtrapClient } from 'mailtrap';

export interface Email {
  para: { nome: string; email: string };
  assunto: string;
  html: string;
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

  private registrarNoLog({ para, assunto, html }: Email): void {
    const texto = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    this.logger.log(
      `[DEV MAIL] to=${para.email} subject="${assunto}"\n${texto}`,
    );
  }

  private async entregar(
    token: string,
    { para, assunto, html }: Email,
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
    });
    this.logger.log(`Email enviado para ${para.email}: "${assunto}"`);
  }
}
