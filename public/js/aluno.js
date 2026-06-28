document.addEventListener("DOMContentLoaded", async () => {
  const autorizado = window.Session?.protegerPagina?.(["aluno"]);

  if (!autorizado) {
    return;
  }

  configurarEnvioAtividade();
  await carregarPainelAluno();
});

async function carregarPainelAluno() {
  mostrarLoadingsAluno();

  const resultados = await buscarColecoesAluno();

  if (resultadoExpirouSessao(resultados)) {
    window.Session?.salvarMensagemFlash?.(
      "Sessão expirada. Faça login novamente.",
      "warning",
    );
    window.Session?.limparSessao?.();
    window.location.replace("login.html");
    return;
  }

  const turmas = resultados.turmas.dados;
  const matriculas = resultados.matriculas.dados;
  const atividades = resultados.atividades.dados;
  const conteudos = resultados.conteudos.dados;
  const notas = resultados.notas.dados;
  const avisos = resultados.avisos.dados;
  const envios = resultados.envios.dados;

  renderResumoAluno({ turmas, atividades, conteudos, notas, avisos, envios });
  renderDisciplinas(
    turmas,
    matriculas,
    resultados.turmas.erro || resultados.matriculas.erro,
  );
  renderAtividades(atividades, notas, envios, resultados.atividades.erro);
  renderConteudos(conteudos, turmas, resultados.conteudos.erro);
  renderNotas(notas, atividades, turmas, resultados.notas.erro);
  renderAvisos(avisos, turmas, resultados.avisos.erro);
}

function mostrarLoadingsAluno() {
  window.UI?.mostrarLoading?.(
    document.getElementById("disciplinas-lista"),
    "Carregando turmas e disciplinas...",
  );
  window.UI?.mostrarLoading?.(
    document.getElementById("atividades-lista"),
    "Carregando atividades...",
  );
  window.UI?.mostrarLoading?.(
    document.getElementById("conteudos-lista"),
    "Carregando conteúdos...",
  );
  window.UI?.mostrarLoading?.(
    document.getElementById("notas-lista"),
    "Carregando notas...",
  );
  window.UI?.mostrarLoading?.(
    document.getElementById("avisos-lista"),
    "Carregando avisos...",
  );
}

async function buscarColecoesAluno() {
  const entradas = await Promise.allSettled([
    buscarLista("/turmas/minhas"),
    buscarLista("/matriculas/minhas"),
    buscarLista("/atividades"),
    buscarLista("/materiais"),
    buscarLista("/notas/minhas"),
    buscarLista("/avisos"),
    buscarLista("/envios-atividades/meus"),
  ]);

  const nomes = [
    "turmas",
    "matriculas",
    "atividades",
    "conteudos",
    "notas",
    "avisos",
    "envios",
  ];

  return nomes.reduce((acc, nome, index) => {
    const resultado = entradas[index];

    if (resultado.status === "fulfilled") {
      acc[nome] = { dados: resultado.value, erro: null };
    } else {
      console.error(`Erro ao carregar ${nome}:`, resultado.reason);
      acc[nome] = { dados: [], erro: resultado.reason };
    }

    return acc;
  }, {});
}

async function buscarLista(caminho) {
  const resposta = await window.Api.get(caminho);
  return extrairLista(resposta);
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.dados)) {
    return resposta.dados;
  }

  if (Array.isArray(resposta?.data)) {
    return resposta.data;
  }

  if (Array.isArray(resposta?.items)) {
    return resposta.items;
  }

  return [];
}

function resultadoExpirouSessao(resultados) {
  return Object.values(resultados).some((resultado) => {
    return String(resultado.erro?.message || "")
      .toLowerCase()
      .includes("sessão expirada");
  });
}

function renderResumoAluno({
  turmas,
  atividades,
  conteudos,
  notas,
  avisos,
  envios,
}) {
  const container = document.getElementById("resumo-aluno");
  if (!container) return;

  const atividadesPendentes = atividades.filter((atividade) => {
    return (
      calcularStatusAtividade(atividade, notas, envios).chave === "pendente"
    );
  }).length;

  const cards = [
    {
      rotulo: "Turmas",
      valor: turmas.length,
      texto: turmas.length === 1 ? "turma vinculada" : "turmas vinculadas",
    },
    {
      rotulo: "Atividades",
      valor: atividadesPendentes,
      texto: atividadesPendentes === 1 ? "pendente" : "pendentes",
    },
    {
      rotulo: "Conteúdos",
      valor: conteudos.length,
      texto:
        conteudos.length === 1
          ? "material disponível"
          : "materiais disponíveis",
    },
    {
      rotulo: "Notas",
      valor: notas.length,
      texto: notas.length === 1 ? "nota lançada" : "notas lançadas",
    },
    {
      rotulo: "Avisos",
      valor: avisos.length,
      texto: avisos.length === 1 ? "comunicado" : "comunicados",
    },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
    <article class="summary-card">
      <span class="summary-label">${escapeHTML(card.rotulo)}</span>
      <strong>${card.valor}</strong>
      <p>${escapeHTML(card.texto)}</p>
    </article>
  `,
    )
    .join("");
}

function renderDisciplinas(turmas, matriculas, erro) {
  const container = document.getElementById("disciplinas-lista");
  if (!container) return;

  if (erro) {
    renderErro(container, "Erro ao carregar suas turmas e disciplinas.");
    return;
  }

  if (!turmas.length) {
    window.UI?.mostrarEstadoVazio?.(
      container,
      "Nenhuma turma ou disciplina encontrada para este aluno.",
    );
    return;
  }

  const matriculasPorTurma = criarMapaPorId(matriculas, "turmaId");

  container.innerHTML = turmas
    .map((turma) => {
      const matricula = matriculasPorTurma.get(Number(turma.id));

      return `
      <article class="course-card">
        <div>
          <h3>${escapeHTML(turma.disciplina || turma.nome || "Disciplina")}</h3>
          <p>${escapeHTML(turma.nome || "Turma não informada")}</p>
          <p>Professor: ${escapeHTML(turma.professor || "Não informado")}</p>
          <p>Período: ${escapeHTML(turma.periodoLetivo || "Não informado")}</p>
        </div>
        <span class="badge ${classeBadgeStatus(matricula?.status || turma.status)}">
          ${escapeHTML(matricula?.status || turma.status || "Ativa")}
        </span>
      </article>
    `;
    })
    .join("");

  window.Paginacao?.aplicar(container, "aluno-disciplinas", { tamanhoPagina: 10 });
}

function renderAtividades(atividades, notas, envios, erro) {
  const container = document.getElementById("atividades-lista");
  if (!container) return;

  if (erro) {
    renderErro(container, "Erro ao carregar atividades.");
    return;
  }

  if (!atividades.length) {
    window.UI?.mostrarEstadoVazio?.(container, "Nenhuma atividade disponível.");
    return;
  }

  const ordenadas = [...atividades].sort(
    (a, b) =>
      dataParaOrdenacao(a.dataEntrega) - dataParaOrdenacao(b.dataEntrega),
  );
  const enviosPorAtividade = criarMapaPorId(envios, "atividadeId");

  container.innerHTML = `
    <ul class="activity-list detailed-list">
      ${ordenadas
        .map((atividade) => {
          const status = calcularStatusAtividade(atividade, notas, envios);
          const envio = enviosPorAtividade.get(Number(atividade.id));
          const podeEnviar = podeEnviarAtividade(atividade, status);
          const textoBotao = envio ? "Atualizar resposta" : "Enviar resposta";
          const comentarioAtual = envio?.comentario || "";

          return `
          <li>
            <div>
              <strong>${escapeHTML(atividade.titulo || "Atividade sem título")}</strong>
              <span>${escapeHTML(atividade.turma || "Turma não informada")}</span>
              ${atividade.descricao ? `<p>${escapeHTML(atividade.descricao)}</p>` : ""}
              ${
                envio
                  ? `
                <div class="feedback feedback-info mt-16">
                  <strong>Resposta enviada:</strong>
                  <p>${escapeHTML(envio.comentario || "Sem comentário informado.")}</p>
                  <small>Último envio: ${escapeHTML(formatarDataTela(envio.dataEnvio))}</small>
                </div>
              `
                  : ""
              }
              ${
                podeEnviar
                  ? `
                <form class="form mt-16 form-envio-atividade" data-action="enviar-atividade" data-atividade-id="${escapeAttr(atividade.id)}">
                  <div class="input-group">
                    <label for="comentario-atividade-${escapeAttr(atividade.id)}">Resposta da atividade</label>
                    <textarea
                      id="comentario-atividade-${escapeAttr(atividade.id)}"
                      name="comentario"
                      placeholder="Digite sua resposta para esta atividade"
                      required
                    >${escapeHTML(comentarioAtual)}</textarea>
                  </div>
                  <button class="button button-primary button-small" type="submit">
                    ${escapeHTML(textoBotao)}
                  </button>
                </form>
              `
                  : ""
              }
            </div>
            <div class="list-meta">
              <time>Entrega: ${escapeHTML(formatarDataTela(atividade.dataEntrega))}</time>
              <span class="badge ${status.classe}">${escapeHTML(status.texto)}</span>
            </div>
          </li>
        `;
        })
        .join("")}
    </ul>
  `;
  window.Paginacao?.aplicar(container, "aluno-atividades", { tamanhoPagina: 10 });
}

function renderConteudos(conteudos, turmas, erro) {
  const container = document.getElementById("conteudos-lista");
  if (!container) return;

  if (erro) {
    renderErro(container, "Erro ao carregar conteúdos.");
    return;
  }

  if (!conteudos.length) {
    window.UI?.mostrarEstadoVazio?.(container, "Nenhum conteúdo disponível.");
    return;
  }

  const turmasPorId = criarMapaPorId(turmas, "id");
  const ordenados = [...conteudos].sort(
    (a, b) =>
      dataParaOrdenacao(b.dataPostagem) - dataParaOrdenacao(a.dataPostagem),
  );

  container.innerHTML = `
    <ul class="simple-list content-list">
      ${ordenados
        .map((conteudo) => {
          const turma = turmasPorId.get(Number(conteudo.turmaId));
          const disciplina =
            turma?.disciplina || conteudo.turma || "Turma não informada";
          const linkArquivo = conteudo.arquivoId
            ? `/arquivos/${conteudo.arquivoId}/download`
            : null;
          const link = conteudo.link || linkArquivo;

          return `
          <li class="content-item">
            <div>
              <strong>${escapeHTML(conteudo.titulo || "Conteúdo sem título")}</strong>
              <span>${escapeHTML(disciplina)}</span>
              ${conteudo.descricao ? `<p>${escapeHTML(conteudo.descricao)}</p>` : ""}
              <small>Publicado em ${escapeHTML(formatarDataTela(conteudo.dataPostagem))}</small>
            </div>
            ${link ? `<a class="button button-secondary button-small" href="${escapeAttr(link)}" target="_blank" rel="noopener">Acessar</a>` : ""}
          </li>
        `;
        })
        .join("")}
    </ul>
  `;
  window.Paginacao?.aplicar(container, "aluno-conteudos", { tamanhoPagina: 10 });
}

function renderNotas(notas, atividades, turmas, erro) {
  const container = document.getElementById("notas-lista");
  if (!container) return;

  if (erro) {
    renderErro(container, "Erro ao carregar notas.");
    return;
  }

  if (!notas.length) {
    window.UI?.mostrarEstadoVazio?.(container, "Nenhuma nota lançada.");
    return;
  }

  const atividadesPorId = criarMapaPorId(atividades, "id");
  const turmasPorId = criarMapaPorId(turmas, "id");
  const ordenadas = [...notas].sort(
    (a, b) =>
      dataParaOrdenacao(b.dataCorrecao) - dataParaOrdenacao(a.dataCorrecao),
  );

  container.innerHTML = `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Disciplina/Turma</th>
            <th>Atividade</th>
            <th>Nota</th>
            <th>Correção</th>
          </tr>
        </thead>
        <tbody>
          ${ordenadas
            .map((nota) => {
              const atividade = atividadesPorId.get(Number(nota.atividadeId));
              const turma = atividade
                ? turmasPorId.get(Number(atividade.turmaId))
                : null;
              const origem =
                turma?.disciplina || atividade?.turma || "Não informado";
              const valorNota = formatarNota(nota.nota, nota.notaMaxima);

              return `
              <tr>
                <td>${escapeHTML(origem)}</td>
                <td>${escapeHTML(nota.atividade || atividade?.titulo || "Avaliação")}</td>
                <td><strong>${escapeHTML(valorNota)}</strong></td>
                <td>${escapeHTML(formatarDataTela(nota.dataCorrecao))}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  window.Paginacao?.aplicar(container, "aluno-notas", { tamanhoPagina: 10 });
}

function renderAvisos(avisos, turmas, erro) {
  const container = document.getElementById("avisos-lista");
  if (!container) return;

  if (erro) {
    renderErro(container, "Erro ao carregar avisos.");
    return;
  }

  if (!avisos.length) {
    window.UI?.mostrarEstadoVazio?.(container, "Nenhum aviso publicado.");
    return;
  }

  const turmasPorId = criarMapaPorId(turmas, "id");
  const ordenados = [...avisos].sort(
    (a, b) =>
      dataParaOrdenacao(b.dataPublicacao) - dataParaOrdenacao(a.dataPublicacao),
  );

  container.innerHTML = `
    <div class="notice-list">
      ${ordenados
        .map((aviso) => {
          const turma = turmasPorId.get(Number(aviso.turmaId));
          const contexto =
            turma?.disciplina || aviso.turma || "Turma não informada";

          return `
          <article class="notice-card">
            <div>
              <h3>${escapeHTML(aviso.titulo || "Aviso")}</h3>
              <p>${escapeHTML(aviso.mensagem || "")}</p>
              <small>${escapeHTML(contexto)} · ${escapeHTML(formatarDataTela(aviso.dataPublicacao))}</small>
            </div>
            ${aviso.autor ? `<span class="badge badge-neutral">${escapeHTML(aviso.autor)}</span>` : ""}
          </article>
        `;
        })
        .join("")}
    </div>
  `;
  window.Paginacao?.aplicar(container, "aluno-avisos", { tamanhoPagina: 10 });
}

function configurarEnvioAtividade() {
  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-action='enviar-atividade']");

    if (!form) {
      return;
    }

    event.preventDefault();
    await enviarRespostaAtividade(form);
  });
}

async function enviarRespostaAtividade(form) {
  const atividadeId = Number(form.dataset.atividadeId);
  const comentario = String(form.comentario?.value || "").trim();

  if (!atividadeId) {
    window.UI?.mostrarErro?.("Atividade inválida.");
    return;
  }

  if (!comentario) {
    window.UI?.mostrarErro?.("Digite uma resposta antes de enviar.");
    return;
  }

  const botao = form.querySelector("button[type='submit']");
  const textoOriginal = botao?.textContent;

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Enviando...";
    }

    await window.Api.post("/envios-atividades", {
      atividadeId,
      comentario,
    });

    window.UI?.mostrarSucesso?.("Resposta enviada com sucesso.");
    await carregarPainelAluno();
  } catch (erro) {
    console.error(erro);
    window.UI?.mostrarErro?.(erro.message || "Erro ao enviar resposta.");
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  }
}

function podeEnviarAtividade(atividade, statusCalculado) {
  const statusAtividade = String(atividade.status || "").toLowerCase();

  if (statusAtividade === "encerrada" || statusAtividade === "cancelada") {
    return false;
  }

  if (statusCalculado?.chave === "corrigida") {
    return false;
  }

  return true;
}

function calcularStatusAtividade(atividade, notas, envios) {
  const nota = notas.find(
    (item) => Number(item.atividadeId) === Number(atividade.id),
  );
  if (nota) {
    return { chave: "corrigida", texto: "Corrigida", classe: "badge-soft" };
  }

  const envio = envios.find(
    (item) => Number(item.atividadeId) === Number(atividade.id),
  );
  if (envio) {
    const texto = envio.status || "Entregue";
    return { chave: "entregue", texto, classe: "badge-soft" };
  }

  const statusAtividade = String(atividade.status || "").toLowerCase();
  if (statusAtividade === "encerrada" || statusAtividade === "cancelada") {
    return {
      chave: statusAtividade,
      texto: atividade.status,
      classe: "badge-neutral",
    };
  }

  if (atividade.dataEntrega && new Date(atividade.dataEntrega) < new Date()) {
    return { chave: "atrasada", texto: "Atrasada", classe: "badge-danger" };
  }

  return { chave: "pendente", texto: "Pendente", classe: "badge-warning" };
}

function criarMapaPorId(lista, campo) {
  const mapa = new Map();

  lista.forEach((item) => {
    const valor = item?.[campo];
    if (valor !== undefined && valor !== null) {
      mapa.set(Number(valor), item);
    }
  });

  return mapa;
}

function classeBadgeStatus(status) {
  const normalizado = String(status || "").toLowerCase();

  if (
    ["ativa", "aberta", "em andamento", "concluída", "concluida"].includes(
      normalizado,
    )
  ) {
    return "badge-soft";
  }

  if (["trancada", "pendente"].includes(normalizado)) {
    return "badge-warning";
  }

  if (["cancelada", "inativa", "encerrada"].includes(normalizado)) {
    return "badge-danger";
  }

  return "badge-neutral";
}

function renderErro(container, texto) {
  container.innerHTML = `<div class="feedback feedback-error">${escapeHTML(texto)}</div>`;
}

function dataParaOrdenacao(valor) {
  if (!valor) return Number.MAX_SAFE_INTEGER;
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? Number.MAX_SAFE_INTEGER
    : data.getTime();
}

function formatarDataTela(valor) {
  if (!valor) return "Não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: data.getHours() || data.getMinutes() ? "2-digit" : undefined,
    minute: data.getHours() || data.getMinutes() ? "2-digit" : undefined,
  }).format(data);
}

function formatarNota(nota, notaMaxima) {
  const valor = Number(nota);
  const maxima = Number(notaMaxima);

  if (Number.isNaN(valor)) {
    return "Não informada";
  }

  if (!Number.isNaN(maxima) && maxima > 0) {
    return `${valor.toFixed(1)} / ${maxima.toFixed(1)}`;
  }

  return valor.toFixed(1);
}

function escapeHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(valor) {
  return escapeHTML(valor).replaceAll("`", "&#096;");
}
