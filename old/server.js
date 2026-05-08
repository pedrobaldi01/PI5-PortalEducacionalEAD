import express from "express";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";

import {
  registerUser,
  createCurso,
  createDisciplina,
  loginUser,
  getAllCursos,
} from "./Interacao.js";

const app = express();

// Middleware de sessão
app.use(
  session({
    secret: "chave-secreta",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ROTAS API
app.post("/api/registerUser", async (req, res) => {
  try {
    const resultado = await registerUser(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/createCurso", async (req, res) => {
  try {
    const resultado = await createCurso(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/createDisciplina", async (req, res) => {
  try {
    const resultado = await createDisciplina(req.body);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/getAllCursos", async (req, res) => {
  try {
    const resultado = await getAllCursos();
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// LOGIN + SESSÃO
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  const result = await loginUser(email, senha);
  if (result.success) {
    req.session.usuario = result.usuario;
    res.json({ success: true, usuario: result.usuario });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

app.get("/api/check-session", (req, res) => {
  if (req.session && req.session.usuario) {
    res.json(req.session.usuario); // pode retornar nome e tipo
  } else {
    res.sendStatus(401);
  }
});

app.post("/api/updatePerfil", async (req, res) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ success: false, error: "Não autenticado" });
  }

  const usuarioId = req.session.usuario.usuario_id;
  const { nome, email, senha } = req.body;

  try {
    const resultado = await updateUsuario(usuarioId, { nome, email, senha });
    if (resultado.success) {
      req.session.usuario.nome = nome;
      req.session.usuario.email = email;
    }
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.sendStatus(200);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});

/* Exemplos de rotas para novas funçoes.

// Rota de login:

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const result = await loginUser(email, senha);
  if (result.success) {
    res.json({ message: 'Login bem-sucedido!', ...result });
  } else {
    res.status(401).json({ error: result.error });
  }
});

//Verifica Usuario Logado;

app.get('/verificar-login', (req, res) => {
  const status = verificarUsuarioLogado(req);
  res.json(status);
});

//listagem das aulas

app.get('/aulas', async (req, res) => {
  const aulas = await listarAulas();

  if (aulas.error) {
    return res.status(500).json({ error: aulas.error });
  }

  res.json(aulas);
});

//litagem das atividades

app.get('/atividades', async (req, res) => {
  const disciplinaId = req.query.disciplina_id ? parseInt(req.query.disciplina_id) : null;

  const atividades = await listarAtividades(disciplinaId);

  if (atividades.error) {
    return res.status(500).json({ error: atividades.error });
  }

res.json(atividades);
});

//Lista notas dos alunos com filtos por aluno e/ou diciplina.

app.get('/notas', async (req, res) => {
  const alunoId = req.query.aluno_id ? parseInt(req.query.aluno_id) : null;
  const disciplinaId = req.query.disciplina_id ? parseInt(req.query.disciplina_id) : null;

  const notas = await listarNotas(alunoId, disciplinaId);

  if (notas.error) {
    return res.status(500).json({ error: notas.error });
  }

  res.json(notas);
});

*/
