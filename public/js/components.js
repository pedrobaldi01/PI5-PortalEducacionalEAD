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
    await carregarHTML(
      "sidebar-container",
      "components/sidebar-professor.html",
    );
  }

  if (tipoPagina === "admin") {
    await carregarHTML("sidebar-container", "components/sidebar-admin.html");
  }

  carregarUsuarioHeader();
  configurarLogoInicial();
  configurarLogout();
  configurarMenuMobile();
  configurarNavegacaoPorSecoes();
  marcarLinkAtivo();
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
  const secaoAtual = obterSecaoAtual();
  const links = document.querySelectorAll(".sidebar-nav a");

  links.forEach((link) => {
    const nav = link.dataset.nav;
    link.classList.toggle("active", nav === secaoAtual);
  });
}

function configurarLogout() {
  const botaoSair = document.getElementById("logout-button");

  if (!botaoSair) {
    return;
  }

  botaoSair.addEventListener("click", () => {
    window.Session?.limparSessao?.();
    window.Session?.salvarMensagemFlash?.(
      "Sessão encerrada com sucesso.",
      "info",
    );
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
    coordenador: "Coordenador",
  };

  return nomes[perfil] || perfil;
}

function configurarMenuMobile() {
  const botaoMenu = document.getElementById("menu-toggle");
  const sidebarContainer = document.getElementById("sidebar-container");

  if (!botaoMenu || !sidebarContainer) {
    return;
  }

  function abrirMenu() {
    document.body.classList.add("menu-open");
    botaoMenu.setAttribute("aria-expanded", "true");
    botaoMenu.setAttribute("aria-label", "Fechar menu de navegação");
  }

  function fecharMenu() {
    document.body.classList.remove("menu-open");
    botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu.setAttribute("aria-label", "Abrir menu de navegação");
  }

  function alternarMenu() {
    if (document.body.classList.contains("menu-open")) {
      fecharMenu();
    } else {
      abrirMenu();
    }
  }

  botaoMenu.addEventListener("click", (event) => {
    event.stopPropagation();
    alternarMenu();
  });

  sidebarContainer.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (link) {
      fecharMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const clicouNoMenu = sidebarContainer.contains(event.target);
    const clicouNoBotao = botaoMenu.contains(event.target);

    if (
      document.body.classList.contains("menu-open") &&
      !clicouNoMenu &&
      !clicouNoBotao
    ) {
      fecharMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fecharMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      fecharMenu();
    }
  });
}

function obterSecaoAtual() {
  const hash = window.location.hash.replace("#", "").trim();
  return hash || "inicio";
}

function configurarNavegacaoPorSecoes() {
  const content = document.querySelector(".content");
  const grid = content?.querySelector(":scope > .dashboard-grid");

  if (!content || !grid) {
    return;
  }

  const secoes = Array.from(grid.querySelectorAll(":scope > [id]"));

  if (!secoes.length) {
    return;
  }

  secoes.forEach((secao) => {
    secao.classList.add("section-panel");
  });

  function encontrarSecao(secaoId) {
    return secoes.find((secao) => secao.id === secaoId);
  }

  function aplicarSecao() {
    let secaoAtual = obterSecaoAtual();
    const ehInicio = secaoAtual === "inicio";

    if (!ehInicio && !encontrarSecao(secaoAtual)) {
      secaoAtual = "inicio";
    }

    const pageHeader = content.querySelector(":scope > .page-header");
    const summaryGrid = content.querySelector(":scope > .summary-grid");

    pageHeader?.classList.toggle("section-hidden", secaoAtual !== "inicio");
    summaryGrid?.classList.toggle("section-hidden", secaoAtual !== "inicio");

    grid.classList.toggle("section-hidden", secaoAtual === "inicio");
    grid.classList.toggle("section-mode", secaoAtual !== "inicio");

    secoes.forEach((secao) => {
      const ativa = secao.id === secaoAtual;
      secao.classList.toggle("section-hidden", secaoAtual === "inicio" || !ativa);
      secao.classList.toggle("active-section", ativa);
    });

    marcarLinkAtivo();
  }

  aplicarSecao();
  window.addEventListener("hashchange", aplicarSecao);

  document.querySelectorAll(".sidebar-nav a[data-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const nav = link.dataset.nav || "inicio";

      if (nav === "inicio") {
        event.preventDefault();
        history.pushState(null, "", "#inicio");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        return;
      }

      if (encontrarSecao(nav)) {
        event.preventDefault();
        history.pushState(null, "", `#${nav}`);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    });
  });
}

/* Paginação visual reutilizável para listas e tabelas renderizadas no frontend */
(function configurarPaginacaoGlobal() {
  if (window.Paginacao) {
    return;
  }

  const estadoPaginas = new Map();

  function encontrarItens(container) {
    if (!container) return [];

    const linhasTabela = Array.from(container.querySelectorAll("tbody tr"));
    if (linhasTabela.length) return linhasTabela;

    const seletores = [
      ".detail-card",
      ".course-card",
      ".content-item",
      ".notice-card",
      ".activity-list > li",
      ".simple-list > li",
      ".content-list > li"
    ];

    for (const seletor of seletores) {
      const itens = Array.from(container.querySelectorAll(seletor));
      if (itens.length) return itens;
    }

    return [];
  }

  function criarControles({ chave, paginaAtual, totalPaginas, totalItens, tamanhoPagina }) {
    const inicio = totalItens === 0 ? 0 : (paginaAtual - 1) * tamanhoPagina + 1;
    const fim = Math.min(totalItens, paginaAtual * tamanhoPagina);

    const botoes = [];

    botoes.push(`
      <button
        class="pagination-button"
        type="button"
        data-pagination-key="${chave}"
        data-pagination-page="${paginaAtual - 1}"
        ${paginaAtual === 1 ? "disabled" : ""}
      >
        Anterior
      </button>
    `);

    const janelas = new Set([1, totalPaginas, paginaAtual - 1, paginaAtual, paginaAtual + 1]);
    const paginas = Array.from(janelas)
      .filter((pagina) => pagina >= 1 && pagina <= totalPaginas)
      .sort((a, b) => a - b);

    let ultima = 0;
    paginas.forEach((pagina) => {
      if (pagina - ultima > 1) {
        botoes.push(`<span class="pagination-ellipsis">...</span>`);
      }

      botoes.push(`
        <button
          class="pagination-button ${pagina === paginaAtual ? "active" : ""}"
          type="button"
          data-pagination-key="${chave}"
          data-pagination-page="${pagina}"
          ${pagina === paginaAtual ? "aria-current=\"page\"" : ""}
        >
          ${pagina}
        </button>
      `);

      ultima = pagina;
    });

    botoes.push(`
      <button
        class="pagination-button"
        type="button"
        data-pagination-key="${chave}"
        data-pagination-page="${paginaAtual + 1}"
        ${paginaAtual === totalPaginas ? "disabled" : ""}
      >
        Próxima
      </button>
    `);

    return `
      <nav class="pagination" aria-label="Paginação da lista">
        <p class="pagination-info">
          Mostrando ${inicio}-${fim} de ${totalItens} registros
        </p>
        <div class="pagination-actions">
          ${botoes.join("")}
        </div>
      </nav>
    `;
  }

  function aplicar(container, chave, opcoes = {}) {
    if (!container || !chave) return;

    container.setAttribute("data-pagination-key-container", chave);

    const tamanhoPagina = Number(opcoes.tamanhoPagina || opcoes.pageSize || 10);
    const itens = encontrarItens(container);
    const totalItens = itens.length;

    container.querySelector(".pagination")?.remove();

    if (totalItens <= tamanhoPagina) {
      itens.forEach((item) => {
        item.hidden = false;
      });
      estadoPaginas.set(chave, 1);
      return;
    }

    const totalPaginas = Math.ceil(totalItens / tamanhoPagina);
    const paginaSalva = estadoPaginas.get(chave) || 1;
    const paginaAtual = Math.min(Math.max(1, paginaSalva), totalPaginas);
    estadoPaginas.set(chave, paginaAtual);

    const inicio = (paginaAtual - 1) * tamanhoPagina;
    const fim = inicio + tamanhoPagina;

    itens.forEach((item, index) => {
      item.hidden = index < inicio || index >= fim;
    });

    container.insertAdjacentHTML(
      "beforeend",
      criarControles({ chave, paginaAtual, totalPaginas, totalItens, tamanhoPagina })
    );
  }

  function trocarPagina(chave, pagina) {
    const numeroPagina = Number(pagina);
    if (!chave || !Number.isFinite(numeroPagina)) return;

    estadoPaginas.set(chave, numeroPagina);

    const container = document.querySelector(`[data-pagination-key-container="${CSS.escape(chave)}"]`);
    if (!container) return;

    aplicar(container, chave);
  }

  document.addEventListener("click", (event) => {
    const botao = event.target.closest("[data-pagination-key][data-pagination-page]");
    if (!botao) return;

    event.preventDefault();
    trocarPagina(botao.dataset.paginationKey, botao.dataset.paginationPage);
  });

  window.Paginacao = {
    aplicar
  };
})();

