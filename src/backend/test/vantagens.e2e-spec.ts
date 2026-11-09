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

const vantagemValida = {
  nome: '20% de desconto no almoço',
  descricao: 'Válido de segunda a sexta no restaurante do campus.',
  foto: 'https://example.com/almoco.jpg',
  custo: 150,
};

describe('Vantagens (e2e)', () => {
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

  async function logar(login: string, senha = 'senha123') {
    const { body } = await http()
      .post('/auth/login')
      .send({ login, senha })
      .expect(200);
    return `Bearer ${body.accessToken}`;
  }

  async function cadastrarEmpresa(dados = empresaValida) {
    const { body: empresa } = await http()
      .post('/empresas')
      .send(dados)
      .expect(201);
    return { empresa, token: await logar(dados.login) };
  }

  const cadastrar = (token: string, dados: object = vantagemValida) =>
    http().post('/vantagens').set('Authorization', token).send(dados);

  it('empresa cadastra vantagem e ela aparece na listagem geral', async () => {
    const { empresa, token } = await cadastrarEmpresa();

    const { body } = await cadastrar(token).expect(201);
    expect(body).toMatchObject({
      ...vantagemValida,
      ativa: true,
      empresa: { id: empresa.id, nome: 'Restaurante Universitario' },
    });
    expect(body.empresa.usuario.senha).toBeUndefined();

    const tokenProfessor = await logar('prof.ana');
    const lista = await http()
      .get('/vantagens')
      .set('Authorization', tokenProfessor)
      .expect(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].id).toBe(body.id);
  });

  it('rejeita campo faltando, custo invalido e foto que nao e URL', async () => {
    const { token } = await cadastrarEmpresa();

    for (const campo of ['nome', 'descricao', 'foto', 'custo'] as const) {
      const { [campo]: _omitido, ...incompleta } = vantagemValida;
      const { body } = await cadastrar(token, incompleta).expect(400);
      expect(body.campos[campo]).toBeDefined();
    }
    for (const custo of [0, -5, 10.5, '100']) {
      const { body } = await cadastrar(token, {
        ...vantagemValida,
        custo,
      }).expect(400);
      expect(body.campos.custo).toBeDefined();
    }
    const { body } = await cadastrar(token, {
      ...vantagemValida,
      foto: 'almoco.jpg',
    }).expect(400);
    expect(body.campos.foto).toBeDefined();
    await cadastrar(token, { ...vantagemValida, nome: '   ' }).expect(400);
  });

  it('apenas empresas cadastram vantagens', async () => {
    await http().post('/vantagens').send(vantagemValida).expect(401);
    await cadastrar(await logar('prof.ana')).expect(403);
  });

  it('lista em "minhas" so as vantagens da empresa logada', async () => {
    const restaurante = await cadastrarEmpresa();
    const livraria = await cadastrarEmpresa({
      login: 'livraria',
      senha: 'senha123',
      email: 'contato@livraria.com',
      nome: 'Livraria Central',
      cnpj: '11444777000161',
    });
    await cadastrar(restaurante.token).expect(201);
    await cadastrar(livraria.token, {
      ...vantagemValida,
      nome: 'Kit de cadernos',
    }).expect(201);

    const { body } = await http()
      .get('/vantagens/minhas')
      .set('Authorization', livraria.token)
      .expect(200);
    expect(body.map((v: { nome: string }) => v.nome)).toEqual([
      'Kit de cadernos',
    ]);
    const tokenProfessor = await logar('prof.ana');
    await http()
      .get('/vantagens/minhas')
      .set('Authorization', tokenProfessor)
      .expect(403);
  });

  it('empresa edita a propria vantagem, mas nao a de outra empresa', async () => {
    const restaurante = await cadastrarEmpresa();
    const { body: vantagem } = await cadastrar(restaurante.token).expect(201);

    const { body } = await http()
      .patch(`/vantagens/${vantagem.id}`)
      .set('Authorization', restaurante.token)
      .send({ custo: 200, nome: 'Almoço com desconto' })
      .expect(200);
    expect(body).toMatchObject({
      custo: 200,
      nome: 'Almoço com desconto',
      descricao: vantagemValida.descricao,
    });

    await http()
      .patch(`/vantagens/${vantagem.id}`)
      .set('Authorization', restaurante.token)
      .send({ custo: 0 })
      .expect(400);

    const livraria = await cadastrarEmpresa({
      login: 'livraria',
      senha: 'senha123',
      email: 'contato@livraria.com',
      nome: 'Livraria Central',
      cnpj: '11444777000161',
    });
    await http()
      .patch(`/vantagens/${vantagem.id}`)
      .set('Authorization', livraria.token)
      .send({ custo: 1 })
      .expect(403);
    await http()
      .delete(`/vantagens/${vantagem.id}`)
      .set('Authorization', livraria.token)
      .expect(403);
  });

  it('vantagem removida some das listagens e nao pode ser editada', async () => {
    const { token } = await cadastrarEmpresa();
    const { body: vantagem } = await cadastrar(token).expect(201);

    await http()
      .delete(`/vantagens/${vantagem.id}`)
      .set('Authorization', token)
      .expect(204);

    const lista = await http()
      .get('/vantagens')
      .set('Authorization', token)
      .expect(200);
    expect(lista.body).toHaveLength(0);
    await http()
      .get(`/vantagens/${vantagem.id}`)
      .set('Authorization', token)
      .expect(404);
    await http()
      .patch(`/vantagens/${vantagem.id}`)
      .set('Authorization', token)
      .send({ custo: 10 })
      .expect(404);
  });

  it('excluir a empresa remove as vantagens dela', async () => {
    const { empresa, token } = await cadastrarEmpresa();
    await cadastrar(token).expect(201);

    await http()
      .delete(`/empresas/${empresa.id}`)
      .set('Authorization', token)
      .expect(204);

    const tokenProfessor = await logar('prof.ana');
    const lista = await http()
      .get('/vantagens')
      .set('Authorization', tokenProfessor)
      .expect(200);
    expect(lista.body).toHaveLength(0);
  });
});
