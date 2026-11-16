import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { EmailService } from '../src/notificacoes/email.service.js';
import { Resgate } from '../src/transacoes/resgate.entity.js';

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

const empresaValida = {
  login: 'restaurante',
  senha: 'senha123',
  email: 'contato@restaurante.com',
  nome: 'Restaurante Universitario',
  cnpj: '11.222.333/0001-81',
};

const vantagemValida = {
  nome: '20% de desconto no almoço',
  descricao: 'Válido de segunda a sexta no restaurante do campus.',
  foto: 'https://example.com/almoco.jpg',
  custo: 150,
};

const CODIGO = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

describe('Resgates (e2e)', () => {
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

  /** Aluno com "moedas" de saldo e uma vantagem de 150 moedas cadastrada. */
  async function cenario(moedas = 200) {
    const { body: aluno } = await http()
      .post('/alunos')
      .send(alunoValido)
      .expect(201);
    const { body: empresa } = await http()
      .post('/empresas')
      .send(empresaValida)
      .expect(201);
    const tokenEmpresa = await logar('restaurante');
    const { body: vantagem } = await http()
      .post('/vantagens')
      .set('Authorization', tokenEmpresa)
      .send(vantagemValida)
      .expect(201);
    const tokenProfessor = await logar('prof.ana');
    await creditar(tokenProfessor, aluno.id, moedas);
    // So os emails do resgate interessam aos testes.
    enviarEmail.mockClear();
    return {
      aluno,
      empresa,
      vantagem,
      tokenAluno: await logar('maria'),
      tokenEmpresa,
      tokenProfessor,
    };
  }

  const creditar = (
    tokenProfessor: string,
    alunoId: number,
    quantidade: number,
  ) =>
    http()
      .post('/transacoes/envios')
      .set('Authorization', tokenProfessor)
      .send({ alunoId, quantidade, motivo: 'Participação' })
      .expect(201);

  const resgatar = (token: string, vantagemId: unknown) =>
    http()
      .post('/transacoes/resgates')
      .set('Authorization', token)
      .send({ vantagemId });

  const listar = (token: string) =>
    http().get('/transacoes/resgates').set('Authorization', token);

  async function saldoAluno(id: number, token: string): Promise<number> {
    const { body } = await http()
      .get(`/alunos/${id}`)
      .set('Authorization', token)
      .expect(200);
    return body.saldo;
  }

  const resgates = () =>
    app.get(DataSource).manager.find(Resgate, {
      relations: { aluno: true, vantagem: true },
    });

  it('debita o custo do saldo do aluno e devolve o cupom', async () => {
    const { aluno, vantagem, tokenAluno } = await cenario();

    const { body } = await resgatar(tokenAluno, vantagem.id).expect(201);

    expect(body).toEqual({
      id: expect.any(Number),
      data: expect.any(String),
      quantidade: 150,
      codigo: expect.stringMatching(CODIGO),
      saldo: 50,
      vantagem: {
        id: vantagem.id,
        nome: vantagemValida.nome,
        descricao: vantagemValida.descricao,
        foto: vantagemValida.foto,
        empresa: 'Restaurante Universitario',
      },
    });
    expect(await saldoAluno(aluno.id, tokenAluno)).toBe(50);
    expect(await resgates()).toMatchObject([
      { quantidade: 150, codigoCupom: body.codigo, aluno: { id: aluno.id } },
    ]);
  });

  it('envia o mesmo codigo no cupom do aluno e na conferencia da empresa', async () => {
    const { tokenAluno, tokenEmpresa } = await cenario();
    const { body: vantagem } = await http()
      .post('/vantagens')
      .set('Authorization', tokenEmpresa)
      .send({ ...vantagemValida, nome: 'Café & <pão>' })
      .expect(201);

    const { body } = await resgatar(tokenAluno, vantagem.id).expect(201);

    expect(enviarEmail).toHaveBeenCalledTimes(2);
    const emails = enviarEmail.mock.calls.map(([email]) => email);
    const paraAluno = emails.find((e) => e.para.email === 'maria@email.com');
    const paraEmpresa = emails.find(
      (e) => e.para.email === 'contato@restaurante.com',
    );

    expect(paraAluno.html).toContain('Seu cupom está pronto!');
    expect(paraAluno.html).toContain(body.codigo);
    expect(paraAluno.html).toContain('50 moedas');
    expect(paraEmpresa.html).toContain('Nova vantagem resgatada');
    expect(paraEmpresa.html).toContain(body.codigo);
    expect(paraEmpresa.html).toContain('Maria Silva');
    expect(paraEmpresa.assunto).toContain(body.codigo);
    for (const email of [paraAluno, paraEmpresa]) {
      expect(email.html).toContain('Café &amp; &lt;pão&gt;');
      expect(email.html).not.toContain('<pão>');
    }
  });

  it('mantem o resgate quando o email falha', async () => {
    const { aluno, vantagem, tokenAluno } = await cenario();
    enviarEmail.mockRejectedValue(new Error('Mailtrap fora do ar'));

    await resgatar(tokenAluno, vantagem.id).expect(201);

    expect(await saldoAluno(aluno.id, tokenAluno)).toBe(50);
    expect(await resgates()).toHaveLength(1);
  });

  it('bloqueia saldo insuficiente sem debitar, registrar nem enviar email', async () => {
    const { aluno, vantagem, tokenAluno } = await cenario(149);

    const { body } = await resgatar(tokenAluno, vantagem.id).expect(400);

    expect(body.message).toContain('Saldo insuficiente');
    expect(await saldoAluno(aluno.id, tokenAluno)).toBe(149);
    expect(await resgates()).toEqual([]);
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it('permite resgatar com o saldo exatamente igual ao custo', async () => {
    const { aluno, vantagem, tokenAluno } = await cenario(150);

    await resgatar(tokenAluno, vantagem.id).expect(201);

    expect(await saldoAluno(aluno.id, tokenAluno)).toBe(0);
  });

  it('nao resgata vantagem removida ou inexistente', async () => {
    const { aluno, vantagem, tokenAluno, tokenEmpresa } = await cenario();
    await http()
      .delete(`/vantagens/${vantagem.id}`)
      .set('Authorization', tokenEmpresa)
      .expect(204);

    await resgatar(tokenAluno, vantagem.id).expect(404);
    await resgatar(tokenAluno, 999).expect(404);
    const { body } = await resgatar(tokenAluno, 'abc').expect(400);
    expect(body.campos.vantagemId).toBe('Selecione a vantagem.');

    expect(await saldoAluno(aluno.id, tokenAluno)).toBe(200);
  });

  it('apenas alunos resgatam e listam vantagens resgatadas', async () => {
    const { vantagem, tokenEmpresa, tokenProfessor } = await cenario();

    for (const token of [tokenEmpresa, tokenProfessor]) {
      await resgatar(token, vantagem.id).expect(403);
      await listar(token).expect(403);
    }
    await http()
      .post('/transacoes/resgates')
      .send({ vantagemId: vantagem.id })
      .expect(401);
    await http().get('/transacoes/resgates').expect(401);
  });

  describe('listagem', () => {
    it('mostra so os resgates do aluno logado, do mais recente ao mais antigo', async () => {
      const { vantagem, tokenAluno, tokenEmpresa, tokenProfessor } =
        await cenario(400);
      const { body: kit } = await http()
        .post('/vantagens')
        .set('Authorization', tokenEmpresa)
        .send({ ...vantagemValida, nome: 'Kit de cadernos', custo: 100 })
        .expect(201);
      const { body: joao } = await http()
        .post('/alunos')
        .send({
          ...alunoValido,
          login: 'joao',
          email: 'joao@email.com',
          nome: 'João Pereira',
          cpf: '111.444.777-35',
        })
        .expect(201);
      await creditar(tokenProfessor, joao.id, 150);

      const primeiro = await resgatar(tokenAluno, vantagem.id).expect(201);
      await resgatar(await logar('joao'), vantagem.id).expect(201);
      const segundo = await resgatar(tokenAluno, kit.id).expect(201);

      const { body } = await listar(tokenAluno).expect(200);

      expect(body).toEqual([
        {
          id: segundo.body.id,
          data: expect.any(String),
          quantidade: 100,
          codigo: segundo.body.codigo,
          vantagem: expect.objectContaining({
            nome: 'Kit de cadernos',
            empresa: 'Restaurante Universitario',
          }),
        },
        expect.objectContaining({
          id: primeiro.body.id,
          codigo: primeiro.body.codigo,
        }),
      ]);
      expect(primeiro.body.codigo).not.toBe(segundo.body.codigo);
    });

    it('comeca vazia', async () => {
      const { tokenAluno } = await cenario();

      const { body } = await listar(tokenAluno).expect(200);

      expect(body).toEqual([]);
    });

    it('mantem o custo pago e a vantagem depois de editada ou removida', async () => {
      const { vantagem, tokenAluno, tokenEmpresa } = await cenario();
      await resgatar(tokenAluno, vantagem.id).expect(201);

      await http()
        .patch(`/vantagens/${vantagem.id}`)
        .set('Authorization', tokenEmpresa)
        .send({ custo: 999 })
        .expect(200);
      await http()
        .delete(`/vantagens/${vantagem.id}`)
        .set('Authorization', tokenEmpresa)
        .expect(204);

      const { body } = await listar(tokenAluno).expect(200);
      expect(body).toMatchObject([
        { quantidade: 150, vantagem: { nome: vantagemValida.nome } },
      ]);
    });

    it('mantem o cupom quando a empresa exclui a conta', async () => {
      const { empresa, vantagem, tokenAluno, tokenEmpresa } = await cenario();
      const { body: resgate } = await resgatar(tokenAluno, vantagem.id).expect(
        201,
      );

      await http()
        .delete(`/empresas/${empresa.id}`)
        .set('Authorization', tokenEmpresa)
        .expect(204);

      const { body } = await listar(tokenAluno).expect(200);
      expect(body).toEqual([
        expect.objectContaining({
          codigo: resgate.codigo,
          quantidade: 150,
          vantagem: null,
        }),
      ]);
    });

    it('mantem o registro do cupom quando o aluno exclui a conta', async () => {
      const { aluno, vantagem, tokenAluno } = await cenario();
      const { body: resgate } = await resgatar(tokenAluno, vantagem.id).expect(
        201,
      );

      await http()
        .delete(`/alunos/${aluno.id}`)
        .set('Authorization', tokenAluno)
        .expect(204);

      expect(await resgates()).toMatchObject([
        { codigoCupom: resgate.codigo, aluno: null },
      ]);
    });
  });

  it('registra o resgate no extrato do aluno', async () => {
    const { vantagem, tokenAluno } = await cenario();
    const { body: resgate } = await resgatar(tokenAluno, vantagem.id).expect(
      201,
    );

    const { body } = await http()
      .get('/transacoes/extrato')
      .set('Authorization', tokenAluno)
      .expect(200);

    expect(body.saldo).toBe(50);
    expect(body.transacoes).toEqual([
      {
        tipo: 'RESGATE',
        id: resgate.id,
        data: expect.any(String),
        quantidade: 150,
        codigo: resgate.codigo,
        vantagem: vantagemValida.nome,
        empresa: 'Restaurante Universitario',
      },
      expect.objectContaining({ tipo: 'RECEBIMENTO', quantidade: 200 }),
    ]);
  });
});
