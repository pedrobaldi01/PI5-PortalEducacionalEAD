/*
  ui.js
  Mensagens visuais e pequenos estados de interface.
*/
(function () {
  function garantirToastContainer() {
    let container = document.querySelector(".toast-container");

    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function mostrarMensagem(texto, tipo = "info", duracao = 3500) {
    const container = garantirToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    toast.textContent = texto;
    container.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("toast-saindo");
      window.setTimeout(() => toast.remove(), 250);
    }, duracao);
  }

  function definirFeedback(elemento, texto, tipo = "info") {
    if (!elemento) {
      mostrarMensagem(texto, tipo);
      return;
    }

    elemento.textContent = texto;
    elemento.className = `feedback feedback-${tipo}`;
    elemento.classList.remove("hidden");
  }

  function limparFeedback(elemento) {
    if (!elemento) return;
    elemento.textContent = "";
    elemento.classList.add("hidden");
  }

  function mostrarLoading(container, texto = "Carregando...") {
    if (!container) return;
    container.innerHTML = `<div class="loading">${texto}</div>`;
  }

  function mostrarEstadoVazio(container, texto = "Nenhum dado encontrado.") {
    if (!container) return;
    container.innerHTML = `<div class="empty-state">${texto}</div>`;
  }

  function exibirFlashDaSessao() {
    const mensagem = window.Session?.consumirMensagemFlash?.();

    if (mensagem?.texto) {
      mostrarMensagem(mensagem.texto, mensagem.tipo || "info");
    }
  }

  window.UI = {
    mostrarMensagem,
    mostrarSucesso: (texto) => mostrarMensagem(texto, "success"),
    mostrarErro: (texto) => mostrarMensagem(texto, "error"),
    mostrarAviso: (texto) => mostrarMensagem(texto, "warning"),
    mostrarInfo: (texto) => mostrarMensagem(texto, "info"),
    definirFeedback,
    limparFeedback,
    mostrarLoading,
    mostrarEstadoVazio,
    exibirFlashDaSessao
  };
})();
