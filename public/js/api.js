/*
  api.js
  Funções centralizadas para chamadas ao backend local.

  Uso:
    Api.get('/cursos')
    Api.post('/auth/login', { login, senha })
*/
(function () {
  const API_BASE_URL = ""; // mesma origem: http://localhost:3000

  function montarUrl(caminho) {
    if (!caminho) return API_BASE_URL || "/";
    if (caminho.startsWith("http")) return caminho;
    return `${API_BASE_URL}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
  }

  function obterToken() {
    return window.Session?.obterToken?.() || localStorage.getItem("token");
  }

  function montarHeaders(headersExtras = {}, enviarJson = true) {
    const headers = { ...headersExtras };
    const token = obterToken();

    if (enviarJson && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async function request(caminho, opcoes = {}) {
    const { body, headers, isFormData, ...resto } = opcoes;
    const config = {
      ...resto,
      headers: montarHeaders(headers, !isFormData)
    };

    if (body !== undefined) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const resposta = await fetch(montarUrl(caminho), config);
    const contentType = resposta.headers.get("content-type") || "";
    const dados = contentType.includes("application/json")
      ? await resposta.json().catch(() => null)
      : await resposta.text().catch(() => "");

    if (resposta.status === 401) {
      window.Session?.limparSessao?.();
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!resposta.ok) {
      const mensagem = dados?.erro || dados?.error || dados?.mensagem || dados?.message || "Erro na requisição.";
      throw new Error(mensagem);
    }

    return dados;
  }

  window.Api = {
    get: (caminho, opcoes = {}) => request(caminho, { ...opcoes, method: "GET" }),
    post: (caminho, body, opcoes = {}) => request(caminho, { ...opcoes, method: "POST", body }),
    put: (caminho, body, opcoes = {}) => request(caminho, { ...opcoes, method: "PUT", body }),
    patch: (caminho, body, opcoes = {}) => request(caminho, { ...opcoes, method: "PATCH", body }),
    delete: (caminho, opcoes = {}) => request(caminho, { ...opcoes, method: "DELETE" }),
    request
  };
})();
