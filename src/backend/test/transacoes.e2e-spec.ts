import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { EmailService } from '../src/notificacoes/email.service.js';
import { ProfessoresService } from '../src/professores/professores.service.js';
import { EnvioMoedas } from '../src/transacoes/envio-moedas.entity.js';

const alunoValido = {
  login: 'maria',
  senha: 'senha123',
  email: 'maria@email.com',
  nome: 'Maria Silva',
  cpf: '529.982.247-25',
  rg: 'MG-12.345.678',
  endereco: 'Rua A, 100',
  curso: 'Engenharia de Software',
  instituicaoId: 1,
};

describe('Transacoes (e2e)', () => {
  let app: INestApplication;
  const enviarEmail = vi.fn();

  beforeEach(async () => {
    process.env.DB_DATABASE = ':memory:';
    enviarEmail.mockReset();
    enviarEmail.mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({ enviar: enviarEmail })
      .compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function logar(login: string, senha = 'senha123') {
    const { body } = await http()
      .post('/auth/login')
      .send({ login, senha })
      .expect(200);
    return `Bearer ${body.accessToken}`;
  }

  async function cenario() {
    const { body: aluno } = await http()
      .post('/alunos')
      .send(alunoValido)
      .expect(201);
    return {
      aluno,
      tokenAluno: await logar('maria'),
      tokenProfessor: await logar('prof.ana'),
    };
  }

  const enviar = (token: string, dados: object) =>
    http().post('/transacoes/envios').set('Authorization', token).send(dados);

  async function saldoProfessor(token: string): Promise<number> {
    const { body } = await http()
      .get('/professores/me')
      .set('Authorization', token)
      .expect(200);
    return body.saldo;
  }

  async function saldoAluno(id: number, token: string): Promise<number> {
    const { body } = await http()
      .get(`/alunos/${id}`)
      .set('Authorization', token)
      .expect(200);
    return body.saldo;
  }

  const envios = () =>
    app.get(DataSource).manager.find(EnvioMoedas, {
      relations: { aluno: true },
    });

  it('debita o professor, credita o aluno e registra o envio', async () => {
    const { aluno, tokenProfessor } = await cenario();

    const { body } = await enviar(tokenProfessor, {
      alunoId: aluno.id,
      quantidade: 150,
      motivo: '  Ótima apresentação  ',
    }).expect(201);

    expect(body).toMatchObject({
      saldo: 850,
      quantidade: 150,
      motivo: 'Ótima apresentação',
      aluno: 'Maria Silva',
    });
    expect(await saldoProfessor(tokenProfessor)).toBe(850);
    expect(await saldoAluno(aluno.id, tokenProfessor)).toBe(150);
    expect(await envios()).toMatchObject([
      { quantidade: 150, motivo: 'Ótima apresentação' },
    ]);
  });

  it('envia um email ao professor e outro ao aluno, com templates distintos', async () => {
    const { aluno, tokenProfessor } = await cenario();

    await enviar(tokenProfessor, {
      alunoId: aluno.id,
      quantidade: 10,
      motivo: '<b>Parabéns</b>',
    }).expect(201);

    expect(enviarEmail).toHaveBeenCalledTimes(2);
    const emails = enviarEmail.mock.calls.map(([email]) => email);
    const paraProfessor = emails.find(
      (e) => e.para.email === 'ana.souza@example.com',
    );
    const paraAluno = emails.find((e) => e.para.email === 'maria@email.com');

    expect(paraProfessor.html).toContain('Envio de moedas confirmado');
    expect(paraProfessor.html).toContain('990 moedas');
    expect(paraAluno.html).toContain('Você recebeu moedas!');
    expect(paraAluno.html).toContain('Ana Souza');
    expect(paraAluno.html).toContain('&lt;b&gt;Parabéns&lt;/b&gt;');
    expect(paraAluno.html).not.toContain('<b>Parabéns</b>');
  });

  it('mantem o envio quando o email falha', async () => {
    const { aluno, tokenProfessor } = await cenario();
    enviarEmail.mockRejectedValue(new Error('Mailtrap fora do ar'));

    await enviar(tokenProfessor, {
      alunoId: aluno.id,
      quantidade: 10,
      motivo: 'Participação',
    }).expect(201);

    expect(await saldoProfessor(tokenProfessor)).toBe(990);
  });

  it('bloqueia saldo insuficiente sem movimentar nada nem enviar email', async () => {
    const { aluno, tokenProfessor } = await cenario();

    const { body } = await enviar(tokenProfessor, {
      alunoId: aluno.id,
      quantidade: 1001,
      motivo: 'Excesso',
    }).expect(400);

    expect(body.campos.quantidade).toContain('Saldo insuficiente');
    expect(await saldoProfessor(tokenProfessor)).toBe(1000);
    expect(await saldoAluno(aluno.id, tokenProfessor)).toBe(0);
    expect(await envios()).toEqual([]);
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it('nao debita o professor se o aluno nao existe', async () => {
    const { tokenProfessor } = await cenario();

    await enviar(tokenProfessor, {
      alunoId: 999,
      quantidade: 10,
      motivo: 'Teste',
    }).expect(404);

    expect(await saldoProfessor(tokenProfessor)).toBe(1000);
  });

  it('rejeita quantidade nao positiva e motivo em branco', async () => {
    const { aluno, tokenProfessor } = await cenario();

    const { body } = await enviar(tokenProfessor, {
      alunoId: aluno.id,
      quantidade: 0,
      motivo: '   ',
    }).expect(400);

    expect(Object.keys(body.campos).sort()).toEqual(['motivo', 'quantidade']);
  });

  it('impede aluno de enviar moedas e de consultar /professores/me', async () => {
    const { aluno, tokenAluno } = await cenario();

    await enviar(tokenAluno, {
      alunoId: aluno.id,
      quantidade: 1,
      motivo: 'Teste',
    }).expect(403);
    await http()
      .get('/professores/me')
      .set('Authorization', tokenAluno)
      .expect(403);
  });

  it('impede envio para aluno de outra instituicao', async () => {
    const { aluno } = await cenario();
    const tokenCarlos = await logar('prof.carlos');

    await enviar(tokenCarlos, {
      alunoId: aluno.id,
      quantidade: 10,
      motivo: 'Outra instituição',
    }).expect(403);

    expect(await saldoProfessor(tokenCarlos)).toBe(1000);
    expect(await envios()).toEqual([]);
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it('soma o credito semestral uma unica vez por semestre', async () => {
    const { aluno, tokenProfessor } = await cenario();
    const professores = app.get(ProfessoresService, { strict: false });
    await enviar(tokenProfessor, {
      alunoId: aluno.id,
      quantidade: 100,
      motivo: 'Saldo acumulado',
    }).expect(201);

    await professores.creditarSemestre(new Date(2030, 1, 3));
    expect(await saldoProfessor(tokenProfessor)).toBe(1900);

    await professores.creditarSemestre(new Date(2030, 1, 5));
    await professores.creditarSemestre(new Date(2030, 2, 3));
    expect(await saldoProfessor(tokenProfessor)).toBe(1900);

    await professores.creditarSemestre(new Date(2030, 7, 1));
    expect(await saldoProfessor(tokenProfessor)).toBe(2900);
  });

  it('nao expoe a senha em /professores/me', async () => {
    const { tokenProfessor } = await cenario();

    const { body } = await http()
      .get('/professores/me')
      .set('Authorization', tokenProfessor)
      .expect(200);

    expect(body.usuario.senha).toBeUndefined();
  });

  it('mantem o registro do envio quando o aluno exclui a conta', async () => {
    const { aluno, tokenAluno, tokenProfessor } = await cenario();
    await enviar(tokenProfessor, {
      alunoId: aluno.id,
      quantidade: 5,
      motivo: 'Monitoria',
    }).expect(201);

    await http()
      .delete(`/alunos/${aluno.id}`)
      .set('Authorization', tokenAluno)
      .expect(204);

    expect(await envios()).toMatchObject([
      { motivo: 'Monitoria', aluno: null },
    ]);
  });
});
