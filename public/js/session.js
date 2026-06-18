/*
  session.js
  Controle simples de sessão local para apresentação.
*/
(function () {
  const TOKEN_KEY = "token";
  const USUARIO_KEY = "usuario";
  const FLASH_KEY = "flash-message";

  function normalizarPerfil(perfil) {
    if (!perfil) return "";
    return String(perfil)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function salvarSessao(usuario, token) {
    if (!usuario || !token) {
      throw new Error("Dados de sessão inválidos.");
    }

    const usuarioNormalizado = {
      ...usuario,
      perfil: normalizarPerfil(usuario.perfil || usuario.tipo || usuario.role)
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuarioNormalizado));
  }

  function obterToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function obterUsuario() {
    try {
      const valor = localStorage.getItem(USUARIO_KEY);
      return valor ? JSON.parse(valor) : null;
    } catch (erro) {
      console.error("Erro ao ler usuário da sessão:", erro);
      return null;
    }
  }

  function obterPerfil() {
    const usuario = obterUsuario();
    return normalizarPerfil(usuario?.perfil || usuario?.tipo || usuario?.role);
  }

  function usuarioEstaLogado() {
    return Boolean(obterToken() && obterUsuario());
  }

  function limparSessao() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }

  function salvarMensagemFlash(texto, tipo = "info") {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ texto, tipo }));
  }

  function consumirMensagemFlash() {
    try {
      const valor = sessionStorage.getItem(FLASH_KEY);
      sessionStorage.removeItem(FLASH_KEY);
      return valor ? JSON.parse(valor) : null;
    } catch {
      return null;
    }
  }

  function paginaPorPerfil(perfil) {
    const perfilNormalizado = normalizarPerfil(perfil);

    const paginas = {
      aluno: "aluno.html",
      professor: "professor.html",
      administrador: "admin.html",
      admin: "admin.html",
      coordenador: "admin.html"
    };

    return paginas[perfilNormalizado] || "login.html";
  }

  function redirecionarPorPerfil() {
    const perfil = obterPerfil();
    window.location.href = paginaPorPerfil(perfil);
  }

  function protegerPagina(perfisPermitidos = []) {
    const permitidos = perfisPermitidos.map(normalizarPerfil);

    if (!usuarioEstaLogado()) {
      salvarMensagemFlash("Faça login para acessar esta página.", "warning");
      window.location.replace("login.html");
      return false;
    }

    const perfilAtual = obterPerfil();

    if (permitidos.length > 0 && !permitidos.includes(perfilAtual)) {
      salvarMensagemFlash("Você não tem permissão para acessar esta página.", "warning");
      window.location.replace(paginaPorPerfil(perfilAtual));
      return false;
    }

    return true;
  }

  window.Session = {
    salvarSessao,
    obterToken,
    obterUsuario,
    obterPerfil,
    usuarioEstaLogado,
    limparSessao,
    salvarMensagemFlash,
    consumirMensagemFlash,
    paginaPorPerfil,
    redirecionarPorPerfil,
    protegerPagina,
    normalizarPerfil
  };
})();
