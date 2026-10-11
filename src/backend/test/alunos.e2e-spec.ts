import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';

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

describe('Alunos (e2e)', () => {
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

  async function cadastrarELogar(dados = alunoValido) {
    const { body: aluno } = await http()
      .post('/alunos')
      .send(dados)
      .expect(201);
    const { body } = await http()
      .post('/auth/login')
      .send({ login: dados.login, senha: dados.senha })
      .expect(200);
    return { aluno, token: `Bearer ${body.accessToken}` };
  }

  it('lista as instituicoes pre-cadastradas sem autenticacao', async () => {
    const { body } = await http().get('/instituicoes').expect(200);
    expect(body.length).toBeGreaterThan(0);
  });

  it('cadastra aluno com saldo 0, CPF normalizado e sem expor a senha', async () => {
    const { body } = await http().post('/alunos').send(alunoValido).expect(201);

    expect(body).toMatchObject({
      nome: 'Maria Silva',
      cpf: '52998224725',
      saldo: 0,
      usuario: {
        login: 'maria',
        email: 'maria@email.com',
        tipoUsuario: 'ALUNO',
      },
      instituicao: { id: 1 },
    });
    expect(body.usuario.senha).toBeUndefined();
  });

  it('rejeita cadastro com CPF invalido ou campo faltando', async () => {
    await http()
      .post('/alunos')
      .send({ ...alunoValido, cpf: '123.456.789-00' })
      .expect(400);
    const { nome: _nome, ...semNome } = alunoValido;
    await http().post('/alunos').send(semNome).expect(400);
  });

  it('rejeita CPF, email ou login duplicados', async () => {
    await http().post('/alunos').send(alunoValido).expect(201);
    await http()
      .post('/alunos')
      .send({ ...alunoValido, login: 'outro', email: 'outro@email.com' })
      .expect(409);
    await http()
      .post('/alunos')
      .send({ ...alunoValido, login: 'outro', cpf: '11144477735' })
      .expect(409);
    await http()
      .post('/alunos')
      .send({ ...alunoValido, email: 'outro@email.com', cpf: '11144477735' })
      .expect(409);
  });

  it('rejeita instituicao inexistente', async () => {
    await http()
      .post('/alunos')
      .send({ ...alunoValido, instituicaoId: 999 })
      .expect(404);
  });

  it('exige autenticacao para consultar alunos', async () => {
    await http().get('/alunos').expect(401);
  });

  it('login com senha errada retorna 401', async () => {
    await http().post('/alunos').send(alunoValido).expect(201);
    await http()
      .post('/auth/login')
      .send({ login: 'maria', senha: 'errada' })
      .expect(401);
  });

  it('lista e busca alunos quando autenticado', async () => {
    const { aluno, token } = await cadastrarELogar();

    const lista = await http()
      .get('/alunos')
      .set('Authorization', token)
      .expect(200);
    expect(lista.body).toHaveLength(1);
    await http()
      .get(`/alunos/${aluno.id}`)
      .set('Authorization', token)
      .expect(200);
    await http().get('/alunos/999').set('Authorization', token).expect(404);
  });

  it('aluno edita o proprio perfil, mas nao o CPF', async () => {
    const { aluno, token } = await cadastrarELogar();

    const { body } = await http()
      .patch(`/alunos/${aluno.id}`)
      .set('Authorization', token)
      .send({
        curso: 'Ciencia da Computacao',
        email: 'nova@email.com',
        instituicaoId: 2,
      })
      .expect(200);
    expect(body).toMatchObject({
      curso: 'Ciencia da Computacao',
      usuario: { email: 'nova@email.com' },
      instituicao: { id: 2 },
    });

    await http()
      .patch(`/alunos/${aluno.id}`)
      .set('Authorization', token)
      .send({ cpf: '11144477735' })
      .expect(400);
  });

  it('nova senha passa a valer no login', async () => {
    const { aluno, token } = await cadastrarELogar();
    await http()
      .patch(`/alunos/${aluno.id}`)
      .set('Authorization', token)
      .send({ senha: 'novaSenha1' })
      .expect(200);

    await http()
      .post('/auth/login')
      .send({ login: 'maria', senha: 'senha123' })
      .expect(401);
    await http()
      .post('/auth/login')
      .send({ login: 'maria', senha: 'novaSenha1' })
      .expect(200);
  });

  it('aluno nao pode editar nem excluir outro aluno', async () => {
    const { aluno: maria } = await cadastrarELogar();
    const { token: tokenJoao } = await cadastrarELogar({
      ...alunoValido,
      login: 'joao',
      email: 'joao@email.com',
      cpf: '11144477735',
    });

    await http()
      .patch(`/alunos/${maria.id}`)
      .set('Authorization', tokenJoao)
      .send({ curso: 'X' })
      .expect(403);
    await http()
      .delete(`/alunos/${maria.id}`)
      .set('Authorization', tokenJoao)
      .expect(403);
  });

  it('aluno exclui o proprio cadastro e perde o acesso', async () => {
    const { aluno, token } = await cadastrarELogar();

    await http()
      .delete(`/alunos/${aluno.id}`)
      .set('Authorization', token)
      .expect(204);
    await http()
      .post('/auth/login')
      .send({ login: 'maria', senha: 'senha123' })
      .expect(401);
    // Login e CPF ficam livres para um novo cadastro.
    await http().post('/alunos').send(alunoValido).expect(201);
  });
});
