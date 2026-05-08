const express = require('express');

const authRoutes = require('./routes/auth.routes');
const alunosRoutes = require('./routes/alunos.routes');
const professoresRoutes = require('./routes/professores.routes');
const cursosRoutes = require('./routes/cursos.routes');
const disciplinasRoutes = require('./routes/disciplinas.routes');
const turmasRoutes = require('./routes/turmas.routes');

const autenticar = require('./middlewares/auth.middleware');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  return res.status(200).json({
    mensagem: 'API EAD em execução.',
    observacao: 'Use POST /auth/login para entrar no sistema.'
  });
});

app.use('/auth', authRoutes);

app.use('/alunos', autenticar, alunosRoutes);
app.use('/professores', autenticar, professoresRoutes);
app.use('/cursos', autenticar, cursosRoutes);
app.use('/disciplinas', autenticar, disciplinasRoutes);
app.use('/turmas', autenticar, turmasRoutes);

app.use((req, res) => {
  return res.status(404).json({
    erro: 'Rota não encontrada.'
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      erro: 'JSON inválido. Verifique o corpo da requisição.'
    });
  }

  console.error(err);

  return res.status(500).json({
    erro: 'Erro interno do servidor.'
  });
});

module.exports = app;
