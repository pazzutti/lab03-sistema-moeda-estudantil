// Comunicacao com o backend (NestJS). Scripts classicos (sem modulos) para
// que as paginas funcionem tambem abertas direto do disco (file://).

const API_URL = 'http://localhost:3000';

const sessao = {
  get token() {
    return localStorage.getItem('token');
  },
  get usuario() {
    const dados = localStorage.getItem('usuario');
    return dados ? JSON.parse(dados) : null;
  },
  salvar(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },
  limpar() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },
};

/** fetch com JSON e token; lanca Error com a mensagem do backend. */
async function api(caminho, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (sessao.token) {
    headers.Authorization = `Bearer ${sessao.token}`;
  }

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Nao foi possivel conectar ao servidor');
  }

  if (resposta.status === 204) {
    return null;
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    if (resposta.status === 401 && sessao.token) {
      sessao.limpar();
      window.location.href = 'index.html';
    }
    const mensagem = dados?.message ?? `Erro ${resposta.status}`;
    throw new Error(Array.isArray(mensagem) ? mensagem.join('\n') : mensagem);
  }
  return dados;
}

async function login(loginUsuario, senha) {
  const { accessToken } = await api('/auth/login', {
    method: 'POST',
    body: { login: loginUsuario, senha },
  });
  sessao.salvar(accessToken, null);
  sessao.salvar(accessToken, await api('/auth/me'));
}

function logout() {
  sessao.limpar();
  window.location.href = 'index.html';
}

/** Redireciona para o login quando a pagina exige autenticacao. */
function exigirLogin() {
  if (!sessao.token) {
    window.location.href = 'index.html';
  }
}

/** Le os campos de um formulario como objeto, ignorando os vazios. */
function lerFormulario(form, { ignorarVazios = false } = {}) {
  const dados = {};
  for (const [campo, valor] of new FormData(form)) {
    if (ignorarVazios && valor === '') continue;
    dados[campo] = valor;
  }
  return dados;
}

function mostrarMensagem(elemento, texto, tipo = 'erro') {
  elemento.textContent = texto;
  elemento.className = `mensagem ${tipo}`;
  elemento.hidden = false;
}

/** Monta o menu superior conforme o usuario logado. */
function montarMenu() {
  const nav = document.getElementById('menu');
  if (!nav) return;
  const usuario = sessao.usuario;
  if (!usuario) {
    nav.innerHTML = `
      <a href="index.html">Entrar</a>
      <a href="cadastro-aluno.html">Cadastro de aluno</a>
      <a href="cadastro-empresa.html">Cadastro de empresa</a>`;
    return;
  }
  nav.innerHTML = `
    <a href="alunos.html">Alunos</a>
    <a href="empresas.html">Empresas parceiras</a>
    <a href="meu-cadastro.html">Meu cadastro</a>
    <span class="usuario">${escapar(usuario.login)} (${usuario.tipo})</span>
    <button type="button" class="link" onclick="logout()">Sair</button>`;
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function formatarCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCnpj(cnpj) {
  return cnpj.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  );
}

document.addEventListener('DOMContentLoaded', montarMenu);
