document.addEventListener("DOMContentLoaded", () => {
  configurarLogin();
});

function configurarLogin() {
  const form = document.getElementById("form-login");
  const feedback = document.getElementById("login-feedback");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dados = {
      email: form.email.value.trim(),
      senha: form.senha.value
    };

    try {
      const resposta = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        mostrarErro(feedback, resultado.erro || "E-mail ou senha inválidos.");
        return;
      }

      localStorage.setItem("token", resultado.token);
      localStorage.setItem("usuario", JSON.stringify(resultado.usuario));

      const tipo = resultado.usuario?.tipo;

      if (tipo === "Aluno") {
        window.location.href = "aluno.html";
        return;
      }

      if (tipo === "Professor") {
        window.location.href = "professor.html";
        return;
      }

      if (tipo === "Administrador") {
        window.location.href = "admin.html";
        return;
      }

      window.location.href = "aluno.html";
    } catch (erro) {
      console.error(erro);
      mostrarErro(feedback, "Não foi possível conectar ao servidor.");
    }
  });
}

function mostrarErro(elemento, mensagem) {
  if (!elemento) {
    alert(mensagem);
    return;
  }

  elemento.textContent = mensagem;
  elemento.classList.remove("hidden");
}
