
document.addEventListener("DOMContentLoaded", () => {
  window.UI?.exibirFlashDaSessao?.();
  configurarLogin();
});

function configurarLogin() {
  const form = document.getElementById("form-login");
  const feedback = document.getElementById("login-feedback");

  if (!form) {
    return;
  }

  if (window.Session?.usuarioEstaLogado()) {
    window.Session.redirecionarPorPerfil();
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    window.UI?.limparFeedback(feedback);

    const dados = {
      login: form.login.value.trim(),
      senha: form.senha.value
    };

    if (!dados.login || !dados.senha) {
      window.UI?.definirFeedback(feedback, "Informe login/e-mail e senha.", "error");
      return;
    }

    const botao = form.querySelector("button[type='submit']");
    const textoOriginal = botao?.textContent;

    try {
      if (botao) {
        botao.disabled = true;
        botao.textContent = "Entrando...";
      }

      const resultado = await window.Api.post("/auth/login", dados);

      window.Session.salvarSessao(resultado.usuario, resultado.token);
      window.Session.salvarMensagemFlash("Login realizado com sucesso.", "success");
      window.Session.redirecionarPorPerfil();
    } catch (erro) {
      console.error(erro);
      window.UI?.definirFeedback(
        feedback,
        erro.message || "Não foi possível realizar login.",
        "error"
      );
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.textContent = textoOriginal;
      }
    }
  });
}
