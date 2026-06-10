const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const alunosRoutes = require('./routes/alunos.routes');
const professoresRoutes = require('./routes/professores.routes');
const cursosRoutes = require('./routes/cursos.routes');
const disciplinasRoutes = require('./routes/disciplinas.routes');
const turmasRoutes = require('./routes/turmas.routes');
const matriculasRoutes = require('./routes/matriculas.routes');
const materiaisRoutes = require('./routes/materiais.routes');
const atividadesRoutes = require('./routes/atividades.routes');
const enviosAtividadesRoutes = require('./routes/enviosAtividades.routes');
const notasRoutes = require('./routes/notas.routes');
const avisosRoutes = require('./routes/avisos.routes');

const autenticar = require('./middlewares/auth.middleware');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

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
app.use('/matriculas', autenticar, matriculasRoutes);
app.use('/materiais', autenticar, materiaisRoutes);
app.use('/atividades', autenticar, atividadesRoutes);
app.use('/envios-atividades', autenticar, enviosAtividadesRoutes);
app.use('/notas', autenticar, notasRoutes);
app.use('/avisos', autenticar, avisosRoutes);

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

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      erro: 'Registro duplicado. Verifique campos únicos como login, e-mail, CPF ou código.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      erro: 'Registro relacionado não encontrado. Verifique os IDs informados.'
    });
  }

  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ER_ACCESS_DENIED_ERROR' ||
    err.code === 'ER_BAD_DB_ERROR'
  ) {
    return res.status(500).json({
      erro: 'Falha ao conectar ao banco de dados. Verifique as variáveis DB_HOST, DB_USER, DB_PASSWORD e DB_NAME.'
    });
  }

  console.error(err);

  return res.status(500).json({
    erro: 'Erro interno do servidor.'
  });
});

module.exports = app;
