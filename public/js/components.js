document.addEventListener("DOMContentLoaded", () => {
  window.UI?.exibirFlashDaSessao?.();
  carregarComponentes();
});

async function carregarComponentes() {
  await carregarHTML("header-container", "components/header.html");
  await carregarHTML("footer-container", "components/footer.html");

  const tipoPagina = document.body.dataset.page;

  if (tipoPagina === "aluno") {
    await carregarHTML("sidebar-container", "components/sidebar-aluno.html");
  }

  if (tipoPagina === "professor") {
    await carregarHTML("sidebar-container", "components/sidebar-professor.html");
  }

  if (tipoPagina === "admin") {
    await carregarHTML("sidebar-container", "components/sidebar-admin.html");
  }

  marcarLinkAtivo();
  carregarUsuarioHeader();
  configurarLogoInicial();
  configurarLogout();
}

async function carregarHTML(idContainer, caminhoArquivo) {
  const container = document.getElementById(idContainer);

  if (!container) {
    return;
  }

  try {
    const resposta = await fetch(caminhoArquivo);

    if (!resposta.ok) {
      throw new Error(`Não foi possível carregar: ${caminhoArquivo}`);
    }

    container.innerHTML = await resposta.text();
  } catch (erro) {
    console.error(erro);
    container.innerHTML = `
      <div class="feedback feedback-error">
        Erro ao carregar componente.
      </div>
    `;
  }
}

function marcarLinkAtivo() {
  const hashAtual = window.location.hash || "#inicio";
  const links = document.querySelectorAll(".sidebar-nav a");

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (href === hashAtual || (hashAtual === "#inicio" && href.includes(".html"))) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  window.addEventListener("hashchange", marcarLinkAtivo);
}

function configurarLogout() {
  const botaoSair = document.getElementById("logout-button");

  if (!botaoSair) {
    return;
  }

  botaoSair.addEventListener("click", () => {
    window.Session?.limparSessao?.();
    window.Session?.salvarMensagemFlash?.("Sessão encerrada com sucesso.", "info");
    window.location.href = "login.html";
  });
}

function carregarUsuarioHeader() {
  const elementoNome = document.getElementById("header-user-name");

  if (!elementoNome) {
    return;
  }

  const usuario = window.Session?.obterUsuario?.();
  const perfil = window.Session?.obterPerfil?.();

  if (usuario?.nome) {
    const perfilFormatado = perfil ? formatarPerfil(perfil) : "";
    elementoNome.textContent = perfilFormatado
      ? `${usuario.nome} · ${perfilFormatado}`
      : usuario.nome;
  }
}

function configurarLogoInicial() {
  const logo = document.getElementById("brand-home-link");

  if (!logo) {
    return;
  }

  const perfil = window.Session?.obterPerfil?.();
  const pagina = window.Session?.paginaPorPerfil?.(perfil) || "login.html";
  logo.setAttribute("href", pagina);
}

function formatarPerfil(perfil) {
  const nomes = {
    aluno: "Aluno",
    professor: "Professor",
    administrador: "Administrador",
    admin: "Administrador",
    coordenador: "Coordenador"
  };

  return nomes[perfil] || perfil;
}
