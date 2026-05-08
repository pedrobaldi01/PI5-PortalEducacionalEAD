document.addEventListener("DOMContentLoaded", () => {
  configurarCadastroUsuario();
  configurarCadastroCurso();
  configurarCadastrosDemo();
});

function configurarCadastroUsuario() {
  const form = document.getElementById("form-usuario");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dados = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      senha: form.senha.value,
      tipo: form.tipo.value
    };

    try {
      const resposta = await fetch("/api/registerUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
      });

      const resultado = await resposta.json();
      alert(resultado.message || resultado.error || "Requisição concluída.");
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível cadastrar o usuário.");
    }
  });
}

function configurarCadastroCurso() {
  const form = document.getElementById("form-curso");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dados = {
      nome: form.nomeCurso.value.trim(),
      descricao: form.descricaoCurso.value.trim()
    };

    try {
      const resposta = await fetch("/api/createCurso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
      });

      const resultado = await resposta.json();
      alert(resultado.message || resultado.error || "Requisição concluída.");
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível criar o curso.");
    }
  });
}

function configurarCadastrosDemo() {
  const formsDemo = [
    document.getElementById("form-turma"),
    document.getElementById("form-disciplina")
  ];

  formsDemo.forEach((form) => {
    if (!form) {
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      alert("Ação simulada. Esta rota ainda precisa ser conectada ao backend.");
    });
  });
}
