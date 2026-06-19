(function () {
  const estado = {
    alunos: [],
    professores: [],
    cursos: [],
    disciplinas: [],
    turmas: [],
    matriculas: [],
    cursoDisciplinas: []
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const autorizado = window.Session?.protegerPagina?.(["administrador", "admin", "coordenador"]);

    if (!autorizado) {
      return;
    }

    configurarFormularios();
    configurarConsultaCursoDisciplinas();
    await carregarPainelAdmin();
  });

  async function carregarPainelAdmin() {
    mostrarLoadings();

    try {
      const [alunos, professores, cursos, disciplinas, turmas, matriculas] = await Promise.all([
        buscarLista("/alunos"),
        buscarLista("/professores"),
        buscarLista("/cursos"),
        buscarLista("/disciplinas"),
        buscarLista("/turmas"),
        buscarLista("/matriculas")
      ]);

      estado.alunos = alunos;
      estado.professores = professores;
      estado.cursos = cursos;
      estado.disciplinas = disciplinas;
      estado.turmas = turmas;
      estado.matriculas = matriculas;

      renderTudo();
      await carregarCursoDisciplinasSelecionado();
    } catch (erro) {
      console.error(erro);
      window.UI?.mostrarErro?.(erro.message || "Erro ao carregar painel administrativo.");
      renderErroGeral();
    }
  }

  async function buscarLista(caminho) {
    const resposta = await window.Api.get(caminho);
    return extrairLista(resposta);
  }

  function extrairLista(resposta) {
    if (Array.isArray(resposta)) return resposta;
    if (Array.isArray(resposta?.dados)) return resposta.dados;
    if (Array.isArray(resposta?.data)) return resposta.data;
    return [];
  }

  function mostrarLoadings() {
    const ids = [
      "resumo-admin",
      "alunos-admin-lista",
      "professores-admin-lista",
      "cursos-admin-lista",
      "disciplinas-admin-lista",
      "turmas-admin-lista",
      "matriculas-admin-lista",
      "curso-disciplinas-admin-lista"
    ];

    ids.forEach((id) => window.UI?.mostrarLoading?.(document.getElementById(id)));
  }

  function renderTudo() {
    renderResumo();
    popularSelects();
    renderAlunos();
    renderProfessores();
    renderCursos();
    renderDisciplinas();
    renderTurmas();
    renderMatriculas();
  }

  function renderErroGeral() {
    const ids = [
      "resumo-admin",
      "alunos-admin-lista",
      "professores-admin-lista",
      "cursos-admin-lista",
      "disciplinas-admin-lista",
      "turmas-admin-lista",
      "matriculas-admin-lista",
      "curso-disciplinas-admin-lista"
    ];

    ids.forEach((id) => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = `<div class="empty-state empty-state-error">Erro ao carregar dados.</div>`;
      }
    });
  }

  function renderResumo() {
    const container = document.getElementById("resumo-admin");
    if (!container) return;

    const alunosAtivos = estado.alunos.filter((item) => item.status !== "Inativo").length;
    const professoresAtivos = estado.professores.filter((item) => item.status !== "Inativo").length;
    const cursosAtivos = estado.cursos.filter((item) => item.status !== "Inativo").length;
    const turmasAbertas = estado.turmas.filter((item) => ["Aberta", "Em andamento"].includes(item.status)).length;

    const cards = [
      { label: "Alunos", valor: alunosAtivos, texto: "ativos no sistema" },
      { label: "Professores", valor: professoresAtivos, texto: "ativos no sistema" },
      { label: "Cursos", valor: cursosAtivos, texto: "ativos" },
      { label: "Turmas", valor: turmasAbertas, texto: "abertas ou em andamento" }
    ];

    container.innerHTML = cards.map((card) => `
      <article class="summary-card">
        <span class="summary-label">${escapar(card.label)}</span>
        <strong>${card.valor}</strong>
        <p>${escapar(card.texto)}</p>
      </article>
    `).join("");
  }

  function popularSelects() {
    popularSelect("disciplinaProfessor", estado.professores.filter((item) => item.status !== "Inativo"), "id", "nome", "Selecione um professor");
    popularSelect("turmaDisciplina", estado.disciplinas, "id", "nome", "Selecione uma disciplina");
    popularSelect("turmaProfessor", estado.professores.filter((item) => item.status !== "Inativo"), "id", "nome", "Selecione um professor");
    popularSelect("matriculaAluno", estado.alunos.filter((item) => item.status !== "Inativo"), "id", "nome", "Selecione um aluno");
    popularSelect("matriculaTurma", estado.turmas, "id", "nome", "Selecione uma turma", formatarTurmaOption);
    popularSelect("vinculoCurso", estado.cursos.filter((item) => item.status !== "Inativo"), "id", "nome", "Selecione um curso");
    popularSelect("vinculoDisciplina", estado.disciplinas, "id", "nome", "Selecione uma disciplina");
    popularSelect("consultaCursoDisciplinas", estado.cursos, "id", "nome", "Selecione um curso");
  }

  function popularSelect(id, itens, valorCampo, textoCampo, textoVazio, formatadorTexto) {
    const select = document.getElementById(id);
    if (!select) return;

    const valorAnterior = select.value;
    const options = [`<option value="">${escapar(textoVazio)}</option>`].concat(
      itens.map((item) => {
        const valor = item[valorCampo];
        const texto = formatadorTexto ? formatadorTexto(item) : item[textoCampo];
        return `<option value="${escaparAtributo(valor)}">${escapar(texto)}</option>`;
      })
    );

    select.innerHTML = options.join("");
    if ([...select.options].some((option) => option.value === valorAnterior)) {
      select.value = valorAnterior;
    }
  }

  function formatarTurmaOption(turma) {
    return [turma.nome, turma.disciplina, turma.periodoLetivo].filter(Boolean).join(" • ");
  }

  function renderAlunos() {
    const container = document.getElementById("alunos-admin-lista");
    if (!container) return;

    if (!estado.alunos.length) {
      window.UI?.mostrarEstadoVazio?.(container, "Nenhum aluno cadastrado.");
      return;
    }

    container.innerHTML = tabela([
      "Nome", "CPF", "E-mail", "Login", "Ações"
    ], estado.alunos.map((aluno) => [
      escapar(aluno.nome),
      escapar(formatarCpf(aluno.cpf)),
      escapar(aluno.email),
      escapar(aluno.login),
      botoesAcao("aluno", aluno.id)
    ]));
  }

  function renderProfessores() {
    const container = document.getElementById("professores-admin-lista");
    if (!container) return;

    if (!estado.professores.length) {
      window.UI?.mostrarEstadoVazio?.(container, "Nenhum professor cadastrado.");
      return;
    }

    container.innerHTML = tabela([
      "Nome", "Especialidade", "E-mail", "Login", "Ações"
    ], estado.professores.map((professor) => [
      escapar(professor.nome),
      escapar(professor.especialidade || "-"),
      escapar(professor.email),
      escapar(professor.login),
      botoesAcao("professor", professor.id)
    ]));
  }

  function renderCursos() {
    const container = document.getElementById("cursos-admin-lista");
    if (!container) return;

    if (!estado.cursos.length) {
      window.UI?.mostrarEstadoVazio?.(container, "Nenhum curso cadastrado.");
      return;
    }

    container.innerHTML = tabela([
      "Nome", "Categoria", "Carga horária", "Status", "Ações"
    ], estado.cursos.map((curso) => [
      escapar(curso.nome),
      escapar(curso.categoria || "-"),
      escapar(curso.cargaHorariaTotal || "-"),
      badgeStatus(curso.status),
      botoesAcao("curso", curso.id)
    ]));
  }

  function renderDisciplinas() {
    const container = document.getElementById("disciplinas-admin-lista");
    if (!container) return;

    if (!estado.disciplinas.length) {
      window.UI?.mostrarEstadoVazio?.(container, "Nenhuma disciplina cadastrada.");
      return;
    }

    container.innerHTML = tabela([
      "Nome", "Carga horária", "Professor responsável", "Ações"
    ], estado.disciplinas.map((disciplina) => [
      escapar(disciplina.nome),
      escapar(disciplina.cargaHoraria || "-"),
      escapar(disciplina.professorResponsavel || "-"),
      botoesAcao("disciplina", disciplina.id)
    ]));
  }

  function renderTurmas() {
    const container = document.getElementById("turmas-admin-lista");
    if (!container) return;

    if (!estado.turmas.length) {
      window.UI?.mostrarEstadoVazio?.(container, "Nenhuma turma cadastrada.");
      return;
    }

    container.innerHTML = tabela([
      "Código", "Nome", "Disciplina", "Professor", "Período", "Status", "Ações"
    ], estado.turmas.map((turma) => [
      escapar(turma.codigo),
      escapar(turma.nome),
      escapar(turma.disciplina || "-"),
      escapar(turma.professor || "-"),
      escapar(turma.periodoLetivo || "-"),
      badgeStatus(turma.status),
      botoesAcao("turma", turma.id)
    ]));
  }

  function renderMatriculas() {
    const container = document.getElementById("matriculas-admin-lista");
    if (!container) return;

    if (!estado.matriculas.length) {
      window.UI?.mostrarEstadoVazio?.(container, "Nenhuma matrícula cadastrada.");
      return;
    }

    container.innerHTML = tabela([
      "Aluno", "Turma", "Data", "Status", "Ações"
    ], estado.matriculas.map((matricula) => [
      escapar(matricula.aluno || "-"),
      escapar(matricula.turma || "-"),
      escapar(formatarData(matricula.dataMatricula)),
      badgeStatus(matricula.status),
      botoesAcao("matricula", matricula.id)
    ]));
  }

  function renderCursoDisciplinas() {
    const container = document.getElementById("curso-disciplinas-admin-lista");
    if (!container) return;

    if (!estado.cursoDisciplinas.length) {
      window.UI?.mostrarEstadoVazio?.(container, "Nenhuma disciplina vinculada ao curso selecionado.");
      return;
    }

    container.innerHTML = tabela([
      "Disciplina", "Sequência", "Ações"
    ], estado.cursoDisciplinas.map((vinculo) => [
      escapar(vinculo.disciplina || vinculo.disciplinaId),
      escapar(vinculo.sequencia),
      `<button class="button button-small button-ghost-danger" type="button" data-action="remover-curso-disciplina" data-curso-id="${escaparAtributo(vinculo.cursoId)}" data-disciplina-id="${escaparAtributo(vinculo.disciplinaId)}">Remover</button>`
    ]));
  }

  function tabela(cabecalhos, linhas) {
    return `
      <table>
        <thead>
          <tr>${cabecalhos.map((cabecalho) => `<th>${escapar(cabecalho)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${linhas.map((linha) => `<tr>${linha.map((coluna) => `<td>${coluna}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function botoesAcao(tipo, id, desabilitado = false) {
    return `
      <div class="table-actions">
        <button class="button button-small button-ghost-danger" type="button" data-action="remover" data-tipo="${escaparAtributo(tipo)}" data-id="${escaparAtributo(id)}" ${desabilitado ? "disabled" : ""}>Remover</button>
      </div>
    `;
  }

  function badgeStatus(status) {
    const classe = classeStatus(status);
    return `<span class="status-badge ${classe}">${escapar(status || "Sem status")}</span>`;
  }

  function classeStatus(status) {
    const valor = normalizar(status);

    if (["ativo", "ativa", "aberta", "em andamento", "concluida", "concluída"].includes(valor)) return "status-success";
    if (["trancada"].includes(valor)) return "status-warning";
    if (["inativo", "cancelada", "encerrada"].includes(valor)) return "status-danger";
    return "status-info";
  }

  function configurarFormularios() {
    const formularios = {
      "form-aluno": enviarAluno,
      "form-professor": enviarProfessor,
      "form-curso": enviarCurso,
      "form-disciplina": enviarDisciplina,
      "form-turma": enviarTurma,
      "form-matricula": enviarMatricula,
      "form-curso-disciplina": enviarCursoDisciplina
    };

    Object.entries(formularios).forEach(([id, handler]) => {
      const form = document.getElementById(id);
      if (!form) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await enviarFormulario(form, handler);
      });
    });

    document.addEventListener("click", async (event) => {
      const botao = event.target.closest("[data-action]");
      if (!botao) return;

      const action = botao.dataset.action;

      if (action === "remover") {
        await removerRegistro(botao.dataset.tipo, botao.dataset.id, botao);
      }

      if (action === "remover-curso-disciplina") {
        await removerCursoDisciplina(botao.dataset.cursoId, botao.dataset.disciplinaId, botao);
      }
    });
  }

  function configurarConsultaCursoDisciplinas() {
    const select = document.getElementById("consultaCursoDisciplinas");
    if (!select) return;

    select.addEventListener("change", async () => {
      await carregarCursoDisciplinasSelecionado();
    });
  }

  async function enviarFormulario(form, handler) {
    const botao = form.querySelector("button[type='submit']");
    const textoOriginal = botao?.textContent;

    try {
      if (botao) {
        botao.disabled = true;
        botao.textContent = "Salvando...";
      }

      await handler(form);
      form.reset();
      window.UI?.mostrarSucesso?.("Registro salvo com sucesso.");
      await carregarPainelAdmin();
    } catch (erro) {
      console.error(erro);
      window.UI?.mostrarErro?.(erro.message || "Erro ao salvar registro.");
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.textContent = textoOriginal;
      }
    }
  }

  async function enviarAluno(form) {
    await window.Api.post("/alunos", {
      nome: valor(form.nome),
      cpf: valor(form.cpf),
      dataNascimento: valor(form.dataNascimento),
      email: valor(form.email),
      telefone: valor(form.telefone),
      endereco: valor(form.endereco),
      login: valor(form.login),
      senha: form.senha.value
    });
  }

  async function enviarProfessor(form) {
    await window.Api.post("/professores", {
      nome: valor(form.nome),
      cpf: valor(form.cpf),
      especialidade: valor(form.especialidade),
      email: valor(form.email),
      telefone: valor(form.telefone),
      endereco: valor(form.endereco),
      login: valor(form.login),
      senha: form.senha.value
    });
  }

  async function enviarCurso(form) {
    await window.Api.post("/cursos", {
      nome: valor(form.nome),
      descricao: valor(form.descricao),
      cargaHorariaTotal: Number(form.cargaHorariaTotal.value),
      categoria: valor(form.categoria),
      status: valor(form.status) || "Ativo"
    });
  }

  async function enviarDisciplina(form) {
    await window.Api.post("/disciplinas", {
      nome: valor(form.nome),
      descricao: valor(form.descricao),
      cargaHoraria: Number(form.cargaHoraria.value),
      professorResponsavelId: Number(form.professorResponsavelId.value)
    });
  }

  async function enviarTurma(form) {
    await window.Api.post("/turmas", {
      codigo: valor(form.codigo),
      nome: valor(form.nome),
      disciplinaId: Number(form.disciplinaId.value),
      professorId: Number(form.professorId.value),
      periodoLetivo: valor(form.periodoLetivo),
      dataInicio: valor(form.dataInicio),
      dataTermino: valor(form.dataTermino),
      status: valor(form.status) || "Aberta"
    });
  }

  async function enviarMatricula(form) {
    await window.Api.post("/matriculas", {
      alunoId: Number(form.alunoId.value),
      turmaId: Number(form.turmaId.value),
      status: valor(form.status) || "Ativa"
    });
  }

  async function enviarCursoDisciplina(form) {
    const cursoId = Number(form.cursoId.value);

    await window.Api.post(`/cursos/${cursoId}/disciplinas`, {
      disciplinaId: Number(form.disciplinaId.value),
      sequencia: Number(form.sequencia.value)
    });
  }

  async function removerRegistro(tipo, id, botao) {
    if (!id || !tipo) return;

    const rotas = {
      aluno: `/alunos/${id}`,
      professor: `/professores/${id}`,
      curso: `/cursos/${id}`,
      disciplina: `/disciplinas/${id}`,
      turma: `/turmas/${id}`,
      matricula: `/matriculas/${id}`
    };

    const rota = rotas[tipo];
    if (!rota) return;

    const textoConfirmacao = "Deseja remover este registro?";

    if (!confirm(textoConfirmacao)) return;

    try {
      botao.disabled = true;
      await window.Api.delete(rota);
      window.UI?.mostrarSucesso?.("Ação realizada com sucesso.");
      await carregarPainelAdmin();
    } catch (erro) {
      console.error(erro);
      window.UI?.mostrarErro?.(erro.message || "Erro ao realizar ação.");
      botao.disabled = false;
    }
  }

  async function carregarCursoDisciplinasSelecionado() {
    const select = document.getElementById("consultaCursoDisciplinas");
    const container = document.getElementById("curso-disciplinas-admin-lista");
    if (!select || !container) return;

    const cursoId = select.value || document.getElementById("vinculoCurso")?.value;

    if (!cursoId) {
      window.UI?.mostrarEstadoVazio?.(container, "Selecione um curso para consultar os vínculos.");
      estado.cursoDisciplinas = [];
      return;
    }

    try {
      window.UI?.mostrarLoading?.(container);
      const resposta = await window.Api.get(`/cursos/${cursoId}/disciplinas`);
      estado.cursoDisciplinas = extrairLista(resposta);
      renderCursoDisciplinas();
    } catch (erro) {
      console.error(erro);
      container.innerHTML = `<div class="empty-state empty-state-error">Erro ao carregar vínculos do curso.</div>`;
    }
  }

  async function removerCursoDisciplina(cursoId, disciplinaId, botao) {
    if (!cursoId || !disciplinaId) return;
    if (!confirm("Deseja remover este vínculo curso-disciplina?")) return;

    try {
      botao.disabled = true;
      await window.Api.delete(`/cursos/${cursoId}/disciplinas/${disciplinaId}`);
      window.UI?.mostrarSucesso?.("Vínculo removido com sucesso.");
      await carregarCursoDisciplinasSelecionado();
    } catch (erro) {
      console.error(erro);
      window.UI?.mostrarErro?.(erro.message || "Erro ao remover vínculo.");
      botao.disabled = false;
    }
  }

  function valor(campo) {
    return String(campo?.value || "").trim();
  }

  function normalizar(texto) {
    return String(texto || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function formatarCpf(cpf) {
    const valor = String(cpf || "").replace(/\D/g, "");
    if (valor.length !== 11) return cpf || "-";
    return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  function formatarData(data) {
    if (!data) return "-";
    const partes = String(data).split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function escapar(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escaparAtributo(valor) {
    return escapar(valor).replace(/`/g, "&#096;");
  }
})();
