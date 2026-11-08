import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';
import { EmailService } from './email.service.js';

const send = vi.hoisted(() => vi.fn());

vi.mock('mailtrap', () => ({
  MailtrapClient: class {
    send = send;
  },
}));

const email = (nome: string) => ({
  para: { nome, email: `${nome}@email.com` },
  assunto: 'Assunto',
  html: '<p>Oi</p>',
});

describe('EmailService', () => {
  const servico = () =>
    new EmailService({
      get: (chave: string, padrao?: string) =>
        ({ MAILTRAP_API_TOKEN: 'token', MAILTRAP_INTERVALO_MS: '200' })[
          chave
        ] ?? padrao,
    } as ConfigService);

  beforeEach(() => {
    send.mockReset();
  });

  it('espera o intervalo entre um envio e o seguinte', async () => {
    const momentos: number[] = [];
    send.mockImplementation(async () => momentos.push(Date.now()));
    const service = servico();

    await Promise.all([service.enviar(email('a')), service.enviar(email('b'))]);

    expect(send).toHaveBeenCalledTimes(2);
    expect(momentos[1] - momentos[0]).toBeGreaterThanOrEqual(150);
  });

  it('continua a fila quando um envio falha', async () => {
    send.mockRejectedValueOnce(new Error('falhou'));
    send.mockResolvedValueOnce({});
    const service = servico();

    const primeiro = service.enviar(email('a'));
    const segundo = service.enviar(email('b'));

    await expect(primeiro).rejects.toThrow('falhou');
    await expect(segundo).resolves.toBeUndefined();
  });
});
