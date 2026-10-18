import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';

const empresaValida = {
  login: 'restaurante',
  senha: 'senha123',
  email: 'contato@restaurante.com',
  nome: 'Restaurante Universitario',
  cnpj: '11.222.333/0001-81',
};

describe('Empresas (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.DB_DATABASE = ':memory:';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function cadastrarELogar(dados = empresaValida) {
    const { body: empresa } = await http()
      .post('/empresas')
      .send(dados)
      .expect(201);
    const { body } = await http()
      .post('/auth/login')
      .send({ login: dados.login, senha: dados.senha })
      .expect(200);
    return { empresa, token: `Bearer ${body.accessToken}` };
  }

  it('cadastra empresa com CNPJ normalizado e sem expor a senha', async () => {
    const { body } = await http()
      .post('/empresas')
      .send(empresaValida)
      .expect(201);

    expect(body).toMatchObject({
      nome: 'Restaurante Universitario',
      cnpj: '11222333000181',
      usuario: {
        login: 'restaurante',
        email: 'contato@restaurante.com',
        tipoUsuario: 'EMPRESA',
      },
    });
    expect(body.usuario.senha).toBeUndefined();
  });

  it('rejeita cadastro com CNPJ invalido ou campo faltando', async () => {
    await http()
      .post('/empresas')
      .send({ ...empresaValida, cnpj: '11.222.333/0001-80' })
      .expect(400);
    const { nome: _nome, ...semNome } = empresaValida;
    await http().post('/empresas').send(semNome).expect(400);
  });

  it('rejeita CNPJ, email ou login duplicados', async () => {
    await http().post('/empresas').send(empresaValida).expect(201);
    await http()
      .post('/empresas')
      .send({ ...empresaValida, login: 'outra', email: 'outra@email.com' })
      .expect(409);
    await http()
      .post('/empresas')
      .send({ ...empresaValida, login: 'outra', cnpj: '11444777000161' })
      .expect(409);
    await http()
      .post('/empresas')
      .send({
        ...empresaValida,
        email: 'outra@email.com',
        cnpj: '11444777000161',
      })
      .expect(409);
  });

  it('exige autenticacao para consultar empresas', async () => {
    await http().get('/empresas').expect(401);
  });

  it('lista e busca empresas quando autenticado', async () => {
    const { empresa, token } = await cadastrarELogar();

    const lista = await http()
      .get('/empresas')
      .set('Authorization', token)
      .expect(200);
    expect(lista.body).toHaveLength(1);
    await http()
      .get(`/empresas/${empresa.id}`)
      .set('Authorization', token)
      .expect(200);
    await http().get('/empresas/999').set('Authorization', token).expect(404);
  });

  it('empresa edita o proprio cadastro, mas nao o CNPJ', async () => {
    const { empresa, token } = await cadastrarELogar();

    const { body } = await http()
      .patch(`/empresas/${empresa.id}`)
      .set('Authorization', token)
      .send({ nome: 'Novo Nome', email: 'novo@email.com' })
      .expect(200);
    expect(body).toMatchObject({
      nome: 'Novo Nome',
      usuario: { email: 'novo@email.com' },
    });

    await http()
      .patch(`/empresas/${empresa.id}`)
      .set('Authorization', token)
      .send({ cnpj: '11444777000161' })
      .expect(400);
  });

  it('aluno nao pode editar nem excluir uma empresa', async () => {
    const { empresa } = await cadastrarELogar();
    await http()
      .post('/alunos')
      .send({
        login: 'maria',
        senha: 'senha123',
        email: 'maria@email.com',
        nome: 'Maria Silva',
        cpf: '52998224725',
        rg: 'MG-12.345.678',
        endereco: 'Rua A, 100',
        curso: 'Engenharia de Software',
        instituicaoId: 1,
      })
      .expect(201);
    const { body } = await http()
      .post('/auth/login')
      .send({ login: 'maria', senha: 'senha123' })
      .expect(200);
    const tokenAluno = `Bearer ${body.accessToken}`;

    await http()
      .patch(`/empresas/${empresa.id}`)
      .set('Authorization', tokenAluno)
      .send({ nome: 'X' })
      .expect(403);
    await http()
      .delete(`/empresas/${empresa.id}`)
      .set('Authorization', tokenAluno)
      .expect(403);
  });

  it('empresa exclui o proprio cadastro e perde o acesso', async () => {
    const { empresa, token } = await cadastrarELogar();

    await http()
      .delete(`/empresas/${empresa.id}`)
      .set('Authorization', token)
      .expect(204);
    await http()
      .post('/auth/login')
      .send({ login: 'restaurante', senha: 'senha123' })
      .expect(401);
    await http().post('/empresas').send(empresaValida).expect(201);
  });
});
