document.addEventListener("DOMContentLoaded", () => {
  const autorizado = window.Session?.protegerPagina?.(["professor"]);

  if (!autorizado) {
    return;
  }

  inicializarPainelProfessor();
});

const estadoProfessor = {
  perfil: null,
  turmas: [],
  materiais: [],
  atividades: [],
  envios: [],
  notas: [],
  avisos: [],
  alunosPorTurma: new Map(),
};

async function inicializarPainelProfessor() {
  configurarFormulariosProfessor();
  configurarFiltrosProfessor();
  await carregarPainelProfessor();
}

async function carregarPainelProfessor() {
  mostrarLoadingsProfessor();

  try {
    const [perfil, turmas, materiais, atividades, envios, notas, avisos] =
      await Promise.all([
        buscarDados("/professores/me"),
        buscarLista("/turmas/minhas"),
        buscarLista("/materiais"),
        buscarLista("/atividades"),
        buscarLista("/envios-atividades"),
        buscarLista("/notas"),
        buscarLista("/avisos"),
      ]);

    estadoProfessor.perfil = perfil;
    estadoProfessor.turmas = turmas;
    estadoProfessor.materiais = materiais;
    estadoProfessor.atividades = atividades;
    estadoProfessor.envios = envios;
    estadoProfessor.notas = notas;
    estadoProfessor.avisos = avisos;

    renderResumoProfessor();
    renderTurmasProfessor();
    renderMateriaisProfessor();
    renderAtividadesProfessor();
    renderEnviosProfessor();
    renderNotasProfessor();
    renderAvisosProfessor();
    preencherSelectsProfessor();
    await carregarAlunosDaTurmaSelecionada();
    await carregarAlunosParaNota();
  } catch (erro) {
    console.error(erro);
    mostrarErroGeralProfessor(
      erro.message || "Erro ao carregar painel do professor.",
    );
  }
}

async function buscarLista(caminho) {
  const resposta = await window.Api.get(caminho);
  return normalizarLista(resposta);
}

async function buscarDados(caminho) {
  const resposta = await window.Api.get(caminho);
  return resposta?.dados || resposta || null;
}

function normalizarLista(resposta) {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.dados)) return resposta.dados;
  return [];
}

function mostrarLoadingsProfessor() {
  const ids = [
    "resumo-professor",
    "turmas-professor-lista",
    "materiais-professor-lista",
    "atividades-professor-lista",
    "alunos-professor-lista",
    "envios-professor-lista",
    "notas-professor-lista",
    "avisos-professor-lista",
    "avisos-professor-lista",
  ];

  ids.forEach((id) => window.UI?.mostrarLoading(document.getElementById(id)));
}

function mostrarErroGeralProfessor(mensagem) {
  [
    "resumo-professor",
    "turmas-professor-lista",
    "materiais-professor-lista",
    "atividades-professor-lista",
    "alunos-professor-lista",
    "envios-professor-lista",
    "notas-professor-lista",
  ].forEach((id) => {
    const container = document.getElementById(id);
    if (container)
      container.innerHTML = `<div class="feedback feedback-error">${escaparHtml(mensagem)}</div>`;
  });
}

function renderResumoProfessor() {
  const container = document.getElementById("resumo-professor");
  if (!container) return;

  const disciplinasUnicas = new Set(
    estadoProfessor.turmas
      .map((turma) => turma.disciplinaId || turma.disciplina)
      .filter(Boolean),
  );
  const atividadesAbertas = estadoProfessor.atividades.filter(
    (atividade) => atividade.status === "Aberta",
  );
  const enviosRecebidos = estadoProfessor.envios.length;
  const notasLancadas = estadoProfessor.notas.length;
  const avisosPublicados = estadoProfessor.avisos.length;

  container.innerHTML = `
    ${criarCardResumo("Turmas", estadoProfessor.turmas.length, "vinculadas ao professor")}
    ${criarCardResumo("Disciplinas", disciplinasUnicas.size, "disciplinas diferentes")}
    ${criarCardResumo("Atividades", atividadesAbertas.length, "abertas no momento")}
    ${criarCardResumo("Notas", notasLancadas, "lançadas/corrigidas")}
    ${criarCardResumo("Avisos", avisosPublicados, "publicados")}
  `;

  if (enviosRecebidos > 0) {
    container.insertAdjacentHTML(
      "beforeend",
      criarCardResumo("Envios", enviosRecebidos, "recebidos dos alunos"),
    );
  }
}

function criarCardResumo(rotulo, valor, descricao) {
  return `
    <article class="summary-card">
      <span class="summary-label">${escaparHtml(rotulo)}</span>
      <strong>${Number(valor) || 0}</strong>
      <p>${escaparHtml(descricao)}</p>
    </article>
  `;
}

function renderTurmasProfessor() {
  const container = document.getElementById("turmas-professor-lista");
  if (!container) return;

  if (!estadoProfessor.turmas.length) {
    window.UI?.mostrarEstadoVazio(
      container,
      "Nenhuma turma vinculada a este professor.",
    );
    return;
  }

  container.innerHTML = `
    <div class="course-list">
      ${estadoProfessor.turmas
        .map(
          (turma) => `
        <article class="course-card">
          <div>
            <h3>${escaparHtml(turma.disciplina || turma.nome || "Disciplina")}</h3>
            <p>
              Turma: ${escaparHtml(turma.nome || "-")}
              ${turma.codigo ? ` • Código: ${escaparHtml(turma.codigo)}` : ""}
              ${turma.periodoLetivo ? ` • ${escaparHtml(turma.periodoLetivo)}` : ""}
            </p>
            <p>Professor: ${escaparHtml(turma.professor || estadoProfessor.perfil?.nome || "-")}</p>
          </div>
          <span class="badge ${classeStatusTurma(turma.status)}">${escaparHtml(turma.status || "Sem status")}</span>
        </article>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderMateriaisProfessor() {
  const container = document.getElementById("materiais-professor-lista");
  if (!container) return;

  if (!estadoProfessor.materiais.length) {
    window.UI?.mostrarEstadoVazio(
      container,
      "Nenhum conteúdo publicado ainda.",
    );
    return;
  }

  container.innerHTML = `
    <div class="detail-list">
      ${estadoProfessor.materiais
        .map(
          (material) => `
        <article class="detail-card">
          <div class="detail-card-main">
            <h3>${escaparHtml(material.titulo || "Material sem título")}</h3>
            <p>${escaparHtml(material.descricao || "Sem descrição.")}</p>
            <small>
              Turma: ${escaparHtml(material.turma || "-")}
              ${material.dataPostagem ? ` • Publicado em ${formatarDataHora(material.dataPostagem)}` : ""}
            </small>
          </div>
          <div class="detail-card-actions">
            ${material.link ? `<a class="button button-secondary button-small" href="${escaparAtributo(material.link)}" target="_blank" rel="noopener noreferrer">Abrir link</a>` : ""}
            ${material.arquivoId ? `<a class="button button-secondary button-small" href="/arquivos/${material.arquivoId}/download" target="_blank" rel="noopener noreferrer">Baixar arquivo</a>` : ""}
            <button class="button button-ghost-danger button-small" type="button" data-remover-material="${material.id}">Remover</button>
          </div>
        </article>
      `,
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll("[data-remover-material]").forEach((botao) => {
    botao.addEventListener("click", () =>
      removerMaterial(botao.dataset.removerMaterial),
    );
  });
}

function renderAtividadesProfessor() {
  const container = document.getElementById("atividades-professor-lista");
  if (!container) return;

  if (!estadoProfessor.atividades.length) {
    window.UI?.mostrarEstadoVazio(container, "Nenhuma atividade criada ainda.");
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Turma</th>
            <th>Entrega</th>
            <th>Nota máxima</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${estadoProfessor.atividades
            .map(
              (atividade) => `
            <tr>
              <td>
                <strong>${escaparHtml(atividade.titulo || "-")}</strong>
                ${atividade.descricao ? `<br><small>${escaparHtml(atividade.descricao)}</small>` : ""}
              </td>
              <td>${escaparHtml(atividade.turma || "-")}</td>
              <td>${formatarDataHora(atividade.dataEntrega)}</td>
              <td>${formatarNumero(atividade.notaMaxima)}</td>
              <td><span class="status-badge ${classeStatusAtividade(atividade.status)}">${escaparHtml(atividade.status || "-")}</span></td>
              <td>
                <button class="button button-ghost-danger button-small" type="button" data-remover-atividade="${atividade.id}">Remover</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll("[data-remover-atividade]").forEach((botao) => {
    botao.addEventListener("click", () =>
      removerAtividade(botao.dataset.removerAtividade),
    );
  });
}

async function carregarAlunosDaTurmaSelecionada() {
  const select = document.getElementById("alunosTurma");
  const container = document.getElementById("alunos-professor-lista");
  if (!select || !container) return;

  const turmaId = select.value || estadoProfessor.turmas[0]?.id;

  if (!turmaId) {
    window.UI?.mostrarEstadoVazio(
      container,
      "Nenhuma turma disponível para consultar alunos.",
    );
    return;
  }

  select.value = String(turmaId);
  window.UI?.mostrarLoading(container, "Carregando alunos...");

  try {
    const alunos = await obterAlunosDaTurma(turmaId);
    renderAlunosProfessor(alunos);
  } catch (erro) {
    console.error(erro);
    container.innerHTML = `<div class="feedback feedback-error">${escaparHtml(erro.message || "Erro ao carregar alunos.")}</div>`;
  }
}

async function obterAlunosDaTurma(turmaId) {
  const chave = String(turmaId);
  if (estadoProfessor.alunosPorTurma.has(chave)) {
    return estadoProfessor.alunosPorTurma.get(chave);
  }

  const alunos = await buscarLista(`/turmas/${turmaId}/alunos`);
  estadoProfessor.alunosPorTurma.set(chave, alunos);
  return alunos;
}

function renderAlunosProfessor(alunos) {
  const container = document.getElementById("alunos-professor-lista");
  if (!container) return;

  if (!alunos.length) {
    window.UI?.mostrarEstadoVazio(
      container,
      "Nenhum aluno matriculado nesta turma.",
    );
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Status</th>
            <th>Matrícula</th>
          </tr>
        </thead>
        <tbody>
          ${alunos
            .map(
              (aluno) => `
            <tr>
              <td>${escaparHtml(aluno.aluno || "-")}</td>
              <td><span class="status-badge ${classeStatusMatricula(aluno.status)}">${escaparHtml(aluno.status || "-")}</span></td>
              <td>${escaparHtml(aluno.dataMatricula || "-")}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEnviosProfessor() {
  const container = document.getElementById("envios-professor-lista");
  const select = document.getElementById("enviosAtividade");
  if (!container) return;

  const atividadeSelecionada = select?.value;
  let envios = [...estadoProfessor.envios];

  if (atividadeSelecionada) {
    envios = envios.filter(
      (envio) => String(envio.atividadeId) === String(atividadeSelecionada),
    );
  }

  if (!envios.length) {
    window.UI?.mostrarEstadoVazio(
      container,
      atividadeSelecionada
        ? "Nenhum envio para esta atividade."
        : "Nenhum envio recebido ainda.",
    );
    return;
  }

  container.innerHTML = `
    <div class="detail-list">
      ${envios
        .map(
          (envio) => `
        <article class="detail-card">
          <div class="detail-card-main">
            <h3>${escaparHtml(envio.atividade || "Atividade")}</h3>
            <p>Aluno: ${escaparHtml(envio.aluno || "-")}</p>
            <small>
              ${envio.dataEnvio ? `Enviado em ${formatarDataHora(envio.dataEnvio)}` : "Sem data de envio"}
              ${envio.status ? ` • ${escaparHtml(envio.status)}` : ""}
            </small>
            ${envio.comentario ? `<p>${escaparHtml(envio.comentario)}</p>` : ""}
          </div>
          <div class="detail-card-actions">
            ${envio.arquivoId ? `<a class="button button-secondary button-small" href="/arquivos/${envio.arquivoId}/download" target="_blank" rel="noopener noreferrer">Baixar arquivo</a>` : ""}
          </div>
        </article>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderNotasProfessor() {
  const container = document.getElementById("notas-professor-lista");
  if (!container) return;

  if (!estadoProfessor.notas.length) {
    window.UI?.mostrarEstadoVazio(container, "Nenhuma nota lançada ainda.");
    return;
  }

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Atividade</th>
            <th>Nota</th>
            <th>Feedback</th>
            <th>Correção</th>
          </tr>
        </thead>
        <tbody>
          ${estadoProfessor.notas
            .map(
              (nota) => `
            <tr>
              <td>${escaparHtml(nota.aluno || "-")}</td>
              <td>${escaparHtml(nota.atividade || "-")}</td>
              <td><strong>${formatarNumero(nota.nota)} / ${formatarNumero(nota.notaMaxima)}</strong></td>
              <td>${escaparHtml(nota.feedback || "-")}</td>
              <td>${formatarDataHora(nota.dataCorrecao)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAvisosProfessor() {
  const container = document.getElementById("avisos-professor-lista");
  if (!container) return;

  if (!estadoProfessor.avisos.length) {
    window.UI?.mostrarEstadoVazio(container, "Nenhum aviso publicado ainda.");
    return;
  }

  const ordenados = [...estadoProfessor.avisos].sort((a, b) =>
    ordenarDataDecrescente(a.dataPublicacao, b.dataPublicacao),
  );

  container.innerHTML = `
    <div class="detail-list">
      ${ordenados
        .map(
          (aviso) => `
        <article class="detail-card">
          <div class="detail-card-main">
            <h3>${escaparHtml(aviso.titulo || "Aviso")}</h3>
            <p>${escaparHtml(aviso.mensagem || "")}</p>
            <small>
              ${escaparHtml(aviso.turma || "Turma não informada")}
              ${aviso.dataPublicacao ? ` • Publicado em ${formatarDataHora(aviso.dataPublicacao)}` : ""}
            </small>
          </div>
          <div class="table-actions">
            <button
              class="button button-small button-ghost-danger"
              type="button"
              onclick="removerAviso(${Number(aviso.id)})"
            >
              Remover
            </button>
          </div>
        </article>
      `,
        )
        .join("")}
    </div>
  `;
}

function preencherSelectsProfessor() {
  preencherSelectTurmas("materialTurma");
  preencherSelectTurmas("atividadeTurma");
  preencherSelectTurmas("avisoTurma");
  preencherSelectTurmas("alunosTurma", "Selecione uma turma");
  preencherSelectAtividades("enviosAtividade", "Todas as atividades", true);
  preencherSelectAtividades("notaAtividade", "Selecione uma atividade");
  preencherSelectAlunosNota([]);
}

function preencherSelectTurmas(id, textoInicial = "Selecione uma turma") {
  const select = document.getElementById(id);
  if (!select) return;

  if (!estadoProfessor.turmas.length) {
    select.innerHTML = `<option value="">Nenhuma turma disponível</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = `
    <option value="">${escaparHtml(textoInicial)}</option>
    ${estadoProfessor.turmas
      .map(
        (turma) => `
      <option value="${turma.id}">${escaparHtml(turma.nome || "Turma")} — ${escaparHtml(turma.disciplina || "Disciplina")}</option>
    `,
      )
      .join("")}
  `;
}

function preencherSelectAtividades(
  id,
  textoInicial = "Selecione uma atividade",
  permitirTodas = false,
) {
  const select = document.getElementById(id);
  if (!select) return;

  if (!estadoProfessor.atividades.length) {
    select.innerHTML = `<option value="">Nenhuma atividade disponível</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = `
    <option value="">${escaparHtml(textoInicial)}</option>
    ${estadoProfessor.atividades
      .map(
        (atividade) => `
      <option value="${atividade.id}">${escaparHtml(atividade.titulo || "Atividade")} — ${escaparHtml(atividade.turma || "Turma")}</option>
    `,
      )
      .join("")}
  `;

  if (!permitirTodas && estadoProfessor.atividades.length === 1) {
    select.value = String(estadoProfessor.atividades[0].id);
  }
}

function preencherSelectAlunosNota(alunos) {
  const select = document.getElementById("notaAluno");
  if (!select) return;

  if (!alunos.length) {
    select.innerHTML = `<option value="">Nenhum aluno disponível</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = `
    <option value="">Selecione um aluno</option>
    ${alunos
      .map(
        (aluno) => `
      <option value="${aluno.alunoId}">${escaparHtml(aluno.aluno || `Aluno ${aluno.alunoId}`)}</option>
    `,
      )
      .join("")}
  `;
}

function configurarFormulariosProfessor() {
  configurarFormularioMaterial();
  configurarFormularioAtividade();
  configurarFormularioAviso();
  configurarFormularioNota();
}

function configurarFiltrosProfessor() {
  const alunosTurma = document.getElementById("alunosTurma");
  alunosTurma?.addEventListener("change", carregarAlunosDaTurmaSelecionada);

  const enviosAtividade = document.getElementById("enviosAtividade");
  enviosAtividade?.addEventListener("change", renderEnviosProfessor);

  const notaAtividade = document.getElementById("notaAtividade");
  notaAtividade?.addEventListener("change", carregarAlunosParaNota);
}

function configurarFormularioMaterial() {
  const form = document.getElementById("form-material");
  const feedback = document.getElementById("material-feedback");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    window.UI?.limparFeedback(feedback);

    const dados = {
      turmaId: Number(form.turmaId.value),
      titulo: form.titulo.value.trim(),
      descricao: form.descricao.value.trim() || undefined,
      link: form.link.value.trim() || undefined,
      arquivoId: form.arquivoId.value
        ? Number(form.arquivoId.value)
        : undefined,
    };

    if (!dados.link && !dados.arquivoId) {
      window.UI?.definirFeedback(
        feedback,
        "Informe um link ou um ID de arquivo.",
        "error",
      );
      return;
    }

    await executarAcaoFormulario(form, feedback, async () => {
      const resposta = await window.Api.post("/materiais", dados);
      window.UI?.definirFeedback(
        feedback,
        resposta?.mensagem || "Conteúdo publicado com sucesso.",
        "success",
      );
      form.reset();
      await recarregarDadosProfessor(["materiais"]);
    });
  });
}

function configurarFormularioAtividade() {
  const form = document.getElementById("form-atividade");
  const feedback = document.getElementById("atividade-feedback");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    window.UI?.limparFeedback(feedback);

    const dados = {
      turmaId: Number(form.turmaId.value),
      titulo: form.titulo.value.trim(),
      descricao: form.descricao.value.trim() || undefined,
      dataEntrega: form.dataEntrega.value,
      notaMaxima: Number(form.notaMaxima.value),
      status: form.status.value,
      avaliativa: form.avaliativa.value === "true",
    };

    await executarAcaoFormulario(form, feedback, async () => {
      const resposta = await window.Api.post("/atividades", dados);
      window.UI?.definirFeedback(
        feedback,
        resposta?.mensagem || "Atividade criada com sucesso.",
        "success",
      );
      form.reset();
      form.notaMaxima.value = "10";
      form.status.value = "Aberta";
      form.avaliativa.value = "true";
      await recarregarDadosProfessor(["atividades", "envios", "notas"]);
    });
  });
}

function configurarFormularioAviso() {
  const form = document.getElementById("form-aviso");
  const feedback = document.getElementById("aviso-feedback");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    window.UI?.limparFeedback(feedback);

    const dados = {
      turmaId: Number(form.turmaId.value),
      titulo: form.titulo.value.trim(),
      mensagem: form.mensagem.value.trim(),
    };

    await executarAcaoFormulario(form, feedback, async () => {
      const resposta = await window.Api.post("/avisos", dados);
      window.UI?.definirFeedback(
        feedback,
        resposta?.mensagem || "Aviso publicado com sucesso.",
        "success",
      );
      await recarregarDadosProfessor(["avisos"]);
    });
  });
}

function configurarFormularioNota() {
  const form = document.getElementById("form-nota");
  const feedback = document.getElementById("nota-feedback");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    window.UI?.limparFeedback(feedback);

    const atividade = estadoProfessor.atividades.find(
      (item) => String(item.id) === String(form.atividadeId.value),
    );
    const dados = {
      atividadeId: Number(form.atividadeId.value),
      alunoId: Number(form.alunoId.value),
      nota: Number(form.nota.value),
      feedback: form.feedback.value.trim() || undefined,
    };

    if (atividade && dados.nota > Number(atividade.notaMaxima)) {
      window.UI?.definirFeedback(
        feedback,
        `A nota não pode ultrapassar ${formatarNumero(atividade.notaMaxima)}.`,
        "error",
      );
      return;
    }

    await executarAcaoFormulario(form, feedback, async () => {
      const resposta = await window.Api.post("/notas", dados);
      window.UI?.definirFeedback(
        feedback,
        resposta?.mensagem || "Nota salva com sucesso.",
        "success",
      );
      form.nota.value = "";
      form.feedback.value = "";
      await recarregarDadosProfessor(["notas"]);
    });
  });
}

async function executarAcaoFormulario(form, feedback, acao) {
  const botao = form.querySelector("button[type='submit']");
  const textoOriginal = botao?.textContent;

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Salvando...";
    }

    await acao();
  } catch (erro) {
    console.error(erro);
    window.UI?.definirFeedback(
      feedback,
      erro.message || "Não foi possível concluir a ação.",
      "error",
    );
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  }
}

async function recarregarDadosProfessor(partes = []) {
  const tarefas = [];

  if (partes.includes("materiais")) {
    tarefas.push(
      buscarLista("/materiais").then((dados) => {
        estadoProfessor.materiais = dados;
      }),
    );
  }

  if (partes.includes("atividades")) {
    tarefas.push(
      buscarLista("/atividades").then((dados) => {
        estadoProfessor.atividades = dados;
      }),
    );
  }

  if (partes.includes("envios")) {
    tarefas.push(
      buscarLista("/envios-atividades").then((dados) => {
        estadoProfessor.envios = dados;
      }),
    );
  }

  if (partes.includes("notas")) {
    tarefas.push(
      buscarLista("/notas").then((dados) => {
        estadoProfessor.notas = dados;
      }),
    );
  }

  if (partes.includes("avisos")) {
    tarefas.push(
      buscarLista("/avisos").then((dados) => {
        estadoProfessor.avisos = dados;
      }),
    );
  }

  await Promise.all(tarefas);
  renderResumoProfessor();
  renderMateriaisProfessor();
  renderAtividadesProfessor();
  renderEnviosProfessor();
  renderNotasProfessor();
  renderAvisosProfessor();
  preencherSelectAtividades("enviosAtividade", "Todas as atividades", true);
  preencherSelectAtividades("notaAtividade", "Selecione uma atividade");
  await carregarAlunosParaNota();
}

async function carregarAlunosParaNota() {
  const selectAtividade = document.getElementById("notaAtividade");
  const atividadeId = selectAtividade?.value;

  if (!atividadeId) {
    preencherSelectAlunosNota([]);
    return;
  }

  const atividade = estadoProfessor.atividades.find(
    (item) => String(item.id) === String(atividadeId),
  );
  if (!atividade?.turmaId) {
    preencherSelectAlunosNota([]);
    return;
  }

  try {
    const alunos = await obterAlunosDaTurma(atividade.turmaId);
    preencherSelectAlunosNota(alunos);

    const inputNota = document.getElementById("notaValor");
    if (inputNota && atividade.notaMaxima) {
      inputNota.max = atividade.notaMaxima;
      inputNota.placeholder = `Máximo ${formatarNumero(atividade.notaMaxima)}`;
    }
  } catch (erro) {
    console.error(erro);
    preencherSelectAlunosNota([]);
    window.UI?.mostrarErro(
      erro.message || "Erro ao carregar alunos da atividade.",
    );
  }
}

async function removerAviso(id) {
  if (!id || !confirm("Deseja remover este aviso?")) return;

  try {
    await window.Api.delete(`/avisos/${id}`);
    window.UI?.mostrarSucesso("Aviso removido com sucesso.");
    await recarregarDadosProfessor(["avisos"]);
  } catch (erro) {
    console.error(erro);
    window.UI?.mostrarErro(erro.message || "Erro ao remover aviso.");
  }
}

async function removerMaterial(id) {
  if (!id || !confirm("Deseja remover este conteúdo?")) return;

  try {
    await window.Api.delete(`/materiais/${id}`);
    window.UI?.mostrarSucesso("Conteúdo removido com sucesso.");
    await recarregarDadosProfessor(["materiais"]);
  } catch (erro) {
    console.error(erro);
    window.UI?.mostrarErro(erro.message || "Erro ao remover conteúdo.");
  }
}

async function removerAtividade(id) {
  if (!id || !confirm("Deseja remover esta atividade?")) return;

  try {
    await window.Api.delete(`/atividades/${id}`);
    window.UI?.mostrarSucesso("Atividade removida com sucesso.");
    await recarregarDadosProfessor(["atividades", "envios", "notas"]);
  } catch (erro) {
    console.error(erro);
    window.UI?.mostrarErro(erro.message || "Erro ao remover atividade.");
  }
}

function classeStatusTurma(status = "") {
  const normalizado = status.toLowerCase();
  if (normalizado.includes("andamento")) return "badge-soft";
  if (normalizado.includes("encerrada")) return "badge-neutral";
  if (normalizado.includes("cancelada")) return "badge-danger";
  return "";
}

function classeStatusAtividade(status = "") {
  const normalizado = status.toLowerCase();
  if (normalizado.includes("aberta")) return "status-success";
  if (normalizado.includes("encerrada")) return "status-neutral";
  if (normalizado.includes("cancelada")) return "status-danger";
  return "status-info";
}

function classeStatusMatricula(status = "") {
  const normalizado = status.toLowerCase();
  if (normalizado.includes("ativa")) return "status-success";
  if (normalizado.includes("conclu")) return "status-info";
  if (normalizado.includes("trancada")) return "status-warning";
  if (normalizado.includes("cancelada")) return "status-danger";
  return "status-neutral";
}

function ordenarDataDecrescente(a, b) {
  return dataParaOrdenacao(b) - dataParaOrdenacao(a);
}

function dataParaOrdenacao(valor) {
  if (!valor) return 0;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}

function formatarDataHora(valor) {
  if (!valor) return "-";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return escaparHtml(String(valor));

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return escaparHtml(String(valor));
  return numero.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparAtributo(valor) {
  return escaparHtml(valor).replaceAll("`", "&#096;");
}

window.removerAviso = removerAviso;
